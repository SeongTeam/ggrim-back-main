import {
	Body,
	Controller,
	DefaultValuePipe,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
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
import { ReplacePaintingDTO } from "./dto/request/replacePainting.dto";
import { Painting } from "./entities/painting.entity";
import { PaintingService } from "./painting.service";
import { Pagination } from "../_common/types";
import { ApiPaginationResponse } from "../_common/decorator/swagger/apiPaginationResponse";
import { ShowPainting, ShowPaintingResponse } from "./dto/response/showPainting.response";
import { UseRolesGuard } from "../auth/guard/decorator/authorization";
import { ApiCreatedResponse, ApiOkResponse } from "@nestjs/swagger";
import { GetByIdsQueryDTO } from "./dto/request/getByIds.query.dto";
import { SearchPaintingQueryDTO } from "./dto/request/searchPainting.query.dto";

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
	@ApiOkResponse({ type: ShowPaintingResponse, isArray: true })
	@HttpCode(HttpStatus.OK)
	@Get("/by-ids")
	async getManyByIds(@Query() query: GetByIdsQueryDTO): Promise<ShowPaintingResponse[]> {
		const { ids, isS3Access } = query;
		let foundPaintings: Painting[] = await this.service.getManyByIds(ids);

		if (isS3Access) {
			foundPaintings = await this.replaceImageSrcToS3(foundPaintings);
		}

		return foundPaintings.map((p) => new ShowPaintingResponse(p));
	}

	@ApiOkResponse({ type: ShowPaintingResponse, isArray: true })
	@HttpCode(HttpStatus.OK)
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

	@ApiOkResponse({ type: ShowPaintingResponse })
	@HttpCode(HttpStatus.OK)
	@Get(":id")
	async getById(
		@Param("id", ParseUUIDPipe) id: string,
		@Query("isS3Access", new DefaultValuePipe(false), ParseBoolPipe) isS3Access: boolean,
	): Promise<ShowPaintingResponse> {
		let paintings = await this.service.getManyByIds([id]);

		if (isS3Access) {
			paintings = await this.replaceImageSrcToS3([paintings[0]]);
		}

		return new ShowPaintingResponse(paintings[0]);
	}

	@ApiPaginationResponse(ShowPainting)
	@HttpCode(HttpStatus.OK)
	@Get("/")
	async searchMany(@Query() dto: SearchPaintingQueryDTO): Promise<Pagination<ShowPainting>> {
		const { page, isS3Access } = dto;
		const paginationCount = 50;
		const result = await this.service.searchMany(dto, page, paginationCount);
		if (isS3Access) {
			const replaced = await this.replaceImageSrcToS3(result.data);
			result.data = replaced;
		}

		const ret = {
			...result,
			data: result.data.map((p) => new ShowPainting(p)),
		};

		return ret;
	}

	@ApiCreatedResponse({ type: ShowPainting })
	@HttpCode(HttpStatus.CREATED)
	@UseRolesGuard("admin")
	@UseInterceptors(QueryRunnerInterceptor)
	@Post()
	async createPainting(
		@DBQueryRunner() queryRunner: QueryRunner,
		@Body() body: CreatePaintingDTO,
	): Promise<ShowPainting> {
		const newPainting = await this.service.createOne(queryRunner, body);
		return new ShowPainting(newPainting);
	}

	@ApiOkResponse({ type: ShowPaintingResponse })
	@HttpCode(HttpStatus.OK)
	@UseRolesGuard("admin")
	@UseInterceptors(QueryRunnerInterceptor)
	@Put("/:id")
	async replacePainting(
		@DBQueryRunner() queryRunner: QueryRunner,
		@Param("id", ParseUUIDPipe) id: string,
		@Body() dto: ReplacePaintingDTO,
	) {
		const targetPainting = await this.service.findOne({ where: { id } });
		if (!targetPainting) {
			throw new ServiceException("ENTITY_NOT_FOUND", "BAD_REQUEST", `not found id(${id})`);
		}

		await this.service.replaceOne(queryRunner, targetPainting, dto);

		const target = (await this.service.getManyByIds([id]))[0];

		return new ShowPaintingResponse(target);
	}

	@HttpCode(HttpStatus.OK)
	@UseRolesGuard("admin")
	@UseInterceptors(QueryRunnerInterceptor)
	@Delete("/:id")
	async deletePainting(
		@DBQueryRunner() queryRunner: QueryRunner,
		@Param("id", ParseUUIDPipe) id: string,
	) {
		const targetPainting = await this.service.findOne({ where: { id } });
		if (!targetPainting) {
			throw new ServiceException("ENTITY_NOT_FOUND", "BAD_REQUEST", `not found id(${id})`);
		}

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
