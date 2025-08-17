import {
	Body,
	Controller,
	DefaultValuePipe,
	Delete,
	Get,
	Inject,
	Param,
	ParseBoolPipe,
	ParseUUIDPipe,
	Post,
	Put,
	Query,
	UseInterceptors,
} from "@nestjs/common";
import { QueryRunner } from "typeorm";
import { AWS_BUCKET_ARTWORK } from "../_common/const/envKeys";
import { ServiceException } from "../_common/filter/exception/service/serviceException";
import { S3Service } from "../aws/s3.service";
import { DBQueryRunner } from "../db/query-runner/decorator/queryRunner";
import { QueryRunnerInterceptor } from "../db/query-runner/queryRunner.interceptor";
import { CreatePaintingDTO } from "./dto/request/createPainting.dto";
import { GetByIdsQueryDTO } from "./dto/request/getByIds.query.dto";
import { ReplacePaintingDTO } from "./dto/request/replacePainting.dto";
import { SearchPaintingQueryDTO } from "./dto/request/searchPainting.query.dto";
import { Painting } from "./entities/painting.entity";
import { ShortPaintingResponse } from "./dto/response/shortPainting.response";
import { PaintingService } from "./painting.service";
import { Pagination } from "../_common/types";
import { ApiPaginationResponse } from "../_common/decorator/swagger/apiPaginationResponse";
import { ShowPaintingResponse } from "./dto/response/showPainting.response";
import { UseRolesGuard } from "../auth/guard/decorator/authorization";

@Controller("painting")
export class PaintingController {
	constructor(
		@Inject(PaintingService) private readonly service: PaintingService,
		@Inject(S3Service) private readonly s3Service: S3Service,
	) {}

	/**
	 * retrieve multiple paintings by id
	 *
	 * @remarks {domain}/painting/by-ids?ids=id1&id2&id3
	 * Example:
	 * ```
	 * GET backend/painting/by-ids?ids=409ba4c6-0553-4b72-a53a-d9b9857c253d&ids=4f4d9398-b10a-45b8-912c-6ccd0c6700ab
	 * ```
	 */
	@Get("/by-ids")
	async getByIds(@Query() query: GetByIdsQueryDTO): Promise<ShowPaintingResponse[]> {
		const { ids, isS3Access } = query;
		let foundPaintings: Painting[] = await this.service.getByIds(ids);

		if (isS3Access) {
			foundPaintings = await this.replaceImageSrcToS3(foundPaintings);
		}

		return foundPaintings.map((p) => new ShowPaintingResponse(p));
	}

	@Get("artwork-of-week")
	async getWeeklyArtworkData(
		@Query("isS3Access", new DefaultValuePipe(false), ParseBoolPipe) isS3Access: boolean,
	): Promise<ShowPaintingResponse[]> {
		let paintings = await this.service.getWeeklyPaintings();

		if (isS3Access) {
			paintings = await this.replaceImageSrcToS3(paintings);
		}

		return paintings.map((p) => new ShowPaintingResponse(p));
	}

	@Get(":id")
	async getById(
		@Param("id", ParseUUIDPipe) id: string,
		@Query("isS3Access", new DefaultValuePipe(false), ParseBoolPipe) isS3Access: boolean,
	): Promise<ShowPaintingResponse> {
		let paintings = await this.service.getByIds([id]);

		if (isS3Access) {
			paintings = await this.replaceImageSrcToS3([paintings[0]]);
		}

		return new ShowPaintingResponse(paintings[0]);
	}

	@ApiPaginationResponse(ShortPaintingResponse)
	@Get("/")
	async searchPainting(
		@Query() dto: SearchPaintingQueryDTO,
	): Promise<Pagination<ShortPaintingResponse>> {
		const { page, isS3Access } = dto;
		const paginationCount = 50;
		const result = await this.service.searchPainting(dto, page, paginationCount);
		if (isS3Access) {
			const replaced = await this.replaceImageSrcToS3(result.data);
			result.data = replaced;
		}

		const ret = {
			...result,
			data: result.data.map((p) => new ShortPaintingResponse(p)),
		};

		return ret;
	}

	@UseRolesGuard("admin")
	@UseInterceptors(QueryRunnerInterceptor)
	@Post()
	async createPainting(
		@DBQueryRunner() queryRunner: QueryRunner,
		@Body() body: CreatePaintingDTO,
	): Promise<ShowPaintingResponse> {
		try {
			const newPainting = await this.service.create(queryRunner, body);
			return new ShowPaintingResponse(newPainting);
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

	@UseRolesGuard("admin")
	@UseInterceptors(QueryRunnerInterceptor)
	@Put("/:id")
	async replacePainting(
		@DBQueryRunner() queryRunner: QueryRunner,
		@Param("id", ParseUUIDPipe) id: string,
		@Body() dto: ReplacePaintingDTO,
	) {
		const targetPainting = await this.service.findPaintingOrThrow(id);

		await this.service.replace(queryRunner, targetPainting, dto);

		const target = (await this.service.getByIds([id]))[0];

		return new ShowPaintingResponse(target);
	}

	@UseRolesGuard("admin")
	@UseInterceptors(QueryRunnerInterceptor)
	@Delete("/:id")
	async deletePainting(
		@DBQueryRunner() queryRunner: QueryRunner,
		@Param("id", ParseUUIDPipe) id: string,
	) {
		const targetPainting = await this.service.findPaintingOrThrow(id);
		await this.service.deleteOne(queryRunner, targetPainting);
	}

	async replaceImageSrcToS3<T extends Painting>(paintings: T[]) {
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
