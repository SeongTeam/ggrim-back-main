import {
	Body,
	Controller,
	DefaultValuePipe,
	Delete,
	Get,
	Inject,
	Param,
	ParseBoolPipe,
	ParseIntPipe,
	ParseUUIDPipe,
	Post,
	Put,
	Query,
	UseInterceptors,
	UsePipes,
	ValidationPipe,
} from "@nestjs/common";
import { QueryRunner } from "typeorm";
import { CONFIG_FILE_PATH } from "../_common/const/defaultValue";
import { AWS_BUCKET, AWS_BUCKET_ARTWORK, AWS_INIT_FILE_KEY_PREFIX } from "../_common/const/envKeys";
import { ServiceException } from "../_common/filter/exception/service/serviceException";
import { S3Service } from "../aws/s3.service";
import { DBQueryRunner } from "../db/query-runner/decorator/queryRunner";
import { QueryRunnerInterceptor } from "../db/query-runner/queryRunner.interceptor";
import { getLatestMonday } from "../../utils/date";
import { CreatePaintingDTO } from "./dto/request/createPaintingDTO";
import { GetByIdsQueryDTO } from "./dto/request/getByIdsQueryDTO";
import { ReplacePaintingDTO } from "./dto/request/replacePaintingDTO";
import { SearchPaintingDTO } from "./dto/request/searchPaintingDTO";
import { Painting } from "./entities/painting.entity";
import { ShortPainting } from "./types/shortPainting";
import { PaintingService } from "./painting.service";

@UsePipes(new ValidationPipe({ transform: true }))
@Controller("painting")
export class PaintingController {
	constructor(
		@Inject(PaintingService) private readonly service: PaintingService,
		@Inject(S3Service) private readonly s3Service: S3Service,
	) {}

	/**
	 * 사용법 {domain}/painting/by-ids?ids=id1&id2&id3
	 * ex) http://localhost:3000/painting/by-ids?ids=409ba4c6-0553-4b72-a53a-d9b9857c253d&ids=4f4d9398-b10a-45b8-912c-6ccd0c6700ab
	 */
	@Get("/by-ids")
	async getByIds(
		@Query(new ValidationPipe({ transform: true })) query: GetByIdsQueryDTO,
		@Query("isS3Access", new DefaultValuePipe(false), ParseBoolPipe) isS3Access: boolean,
	): Promise<Painting[]> {
		let foundPaintings: Painting[] = await this.service.getByIds(query.ids);

		if (isS3Access) {
			foundPaintings = await this.replaceImageSrcToS3(foundPaintings);
		}

		return foundPaintings;
	}

	@Get("artwork-of-week")
	async getWeeklyArtworkData(
		@Query("isS3Access", new DefaultValuePipe(false), ParseBoolPipe) isS3Access: boolean,
	) {
		let paintings = await this.service.getWeeklyPaintings();

		if (isS3Access) {
			paintings = await this.replaceImageSrcToS3(paintings);
		}

		return paintings;
	}

	/*TODO 
  - [ ]`artwork_of_week_${latestMonday}.json` 파일 내용형식을 DB에 저장된 Painting ID로 명시하기
  - [ ]artist 이름 표기 방식을 서양식으로 변경하기. 현재는 성 + 이름 으로 표기됨. 
  - [ ]GUI 만들기? => DB의 painting id를 찾는 것은 어렵기에
       - painting 검색 후 나온 그림을 클릭으로 .json에 추가하기
  - [ ]API 예외 처리 => id가 없는 경우 response에 메세지 나옴/ 다른 그림의 id일 경우 예외 처리 필요
   */

	@Get("init")
	async initFile(): Promise<string> {
		const latestMonday: string = getLatestMonday();
		const artworkFileName: string = `artwork_of_week_${latestMonday}.json`;
		const bucketName = process.env[AWS_BUCKET] || "no bucket";
		const prefixKey = process.env[AWS_INIT_FILE_KEY_PREFIX];

		try {
			await this.s3Service.downloadFile(
				bucketName,
				prefixKey + artworkFileName,
				CONFIG_FILE_PATH + artworkFileName,
			);

			return "success init";
		} catch (err: unknown) {
			throw new ServiceException(
				"EXTERNAL_SERVICE_FAILED",
				"INTERNAL_SERVER_ERROR",
				`${this.initFile.name}() failed. need to check config`,
				{
					cause: err,
				},
			);
		}
	}

	@Get(":id")
	async getById(
		@Param("id", ParseUUIDPipe) id: string,
		@Query("isS3Access", new DefaultValuePipe(false), ParseBoolPipe) isS3Access: boolean,
	) {
		const paintings = await this.service.getByIds([id]);

		if (isS3Access) {
			const ret = await this.replaceImageSrcToS3([paintings[0]]);
			return ret[0];
		}

		return paintings[0];
	}

	@Get("/")
	async searchPainting(
		@Query() dto: SearchPaintingDTO,
		@Query("page", new DefaultValuePipe(0), ParseIntPipe) page: number,
		@Query("isS3Access", new DefaultValuePipe(false), ParseBoolPipe) isS3Access: boolean,
	) {
		const paginationCount = 50;
		const ret = await this.service.searchPainting(dto, page, paginationCount);
		if (isS3Access) {
			const replaced = await this.replaceImageSrcToS3(ret.data);
			ret.data = replaced;
		}

		return ret;
	}
	@Post()
	@UseInterceptors(QueryRunnerInterceptor)
	async createPainting(
		@DBQueryRunner() queryRunner: QueryRunner,
		@Body() body: CreatePaintingDTO,
	) {
		try {
			const newPaintingWithoutRelations = await this.service.create(queryRunner, body);
			return newPaintingWithoutRelations;
		} catch (error: unknown) {
			/*TODO
        - 비동기 함수의 에러를 캐치할수 있도록, await를 명시하도록 컨벤션을 정해야함.
         - async 함수 내에서 에러가 발생한다면, await를 하지 않는 경우, try-catch문으로 에러를 캐치할수 없다.
         - 방법1) prettier를 사용하여 promise를 처리하도록 규칙을 강제한다.
      */
			throw new ServiceException(
				"ENTITY_CREATE_FAILED",
				"INTERNAL_SERVER_ERROR",
				"need to check internal logic",
				{ cause: error },
			);
		}
	}

	@Put("/:id")
	@UseInterceptors(QueryRunnerInterceptor)
	async replacePainting(
		@DBQueryRunner() queryRunner: QueryRunner,
		@Param("id", ParseUUIDPipe) id: string,
		@Body() dto: ReplacePaintingDTO,
	) {
		const targetPainting = await this.service.findPaintingOrThrow(id);

		await this.service.replace(queryRunner, targetPainting, dto);

		const target = (await this.service.getByIds([id]))[0];

		return target;
	}

	@Delete("/:id")
	@UseInterceptors(QueryRunnerInterceptor)
	async deletePainting(
		@DBQueryRunner() queryRunner: QueryRunner,
		@Param("id", ParseUUIDPipe) id: string,
	) {
		const targetPainting = await this.service.findPaintingOrThrow(id);
		return this.service.deleteOne(queryRunner, targetPainting);
	}

	async replaceImageSrcToS3<T extends ShortPainting>(paintings: T[]) {
		const bucket = process.env[AWS_BUCKET_ARTWORK];
		if (!bucket) {
			throw new ServiceException(
				"SERVICE_RUN_ERROR",
				"INTERNAL_SERVER_ERROR",
				`AWS_BUCKET_ARTWORK env is not config`,
			);
		}

		const urls = await Promise.all(
			paintings.map((p) => this.s3Service.getCloudFrontUrl(bucket, p.image_s3_key)),
		);

		paintings.forEach((p, idx) => {
			p.image_url = urls[idx];
		});

		return paintings;
	}
}
