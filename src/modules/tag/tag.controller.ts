import {
	Crud,
	CrudController,
	CrudRequest,
	GetManyDefaultResponse,
	Override,
	ParsedRequest,
} from "@dataui/crud";
import { Body, Controller, Post, Put, UsePipes, ValidationPipe } from "@nestjs/common";
import { ServiceException } from "../_common/filter/exception/service/serviceException";

import { CreateTagDTO } from "./dto/request/createTag.dto";
import { ReplaceTagDTO } from "./dto/request/replaceTag.dto";
import { Tag } from "./entities/tag.entity";
import { TagService } from "./tag.service";
import { ShowTagResponse } from "./dto/response/showTag.response";
import { isArray } from "class-validator";
import { ApiOverride } from "../_common/decorator/swagger/CRUD/apiOverride";
import { UseRolesGuard } from "../auth/guard/decorator/authorization";
/*TODO
- typeORM 에러 발생시, 특정 에러 메세지는 응답에 포함시켜 보내는 로직 구현 고려
  1) unique constraint 열에 중복된 값을 삽입할 때,

*/
@Crud({
	model: {
		type: Tag,
	},
	params: {
		id: {
			field: "id",
			type: "uuid",
			primary: true,
		},
	},
	routes: {
		only: ["getOneBase", "getManyBase", "deleteOneBase"],
	},
	dto: {
		create: CreateTagDTO,
		replace: ReplaceTagDTO,
	},
	query: {
		join: {
			paintings: {
				eager: false,
				allow: ["id", "title", "image_url"],
			},
		},
		softDelete: true,
		alwaysPaginate: true,
	},
})
@UsePipes(new ValidationPipe({ transform: true }))
@Controller("painting/tag")
export class TagController implements CrudController<Tag> {
	constructor(public service: TagService) {}

	get base(): CrudController<Tag> {
		return this;
	}

	@ApiOverride("getOneBase", ShowTagResponse)
	async getOne(req: CrudRequest): Promise<ShowTagResponse> {
		const tag = await this.service.getOne(req);
		return new ShowTagResponse(tag);
	}

	/**
	 * Retrieve multiple Tags.
	 *
	 * @remarks
	 * use join field, If want Painting[]. you can filter by painting properties like id, title and image_url
	 *
	 * Example:
	 * ```
	 * GET backend/tag?s={"name":{"$cont":"female"}}&join=paintings
	 * ```
	 *
	 *
	 */
	@ApiOverride("getManyBase", ShowTagResponse)
	async getMany(
		@ParsedRequest() req: CrudRequest,
	): Promise<GetManyDefaultResponse<ShowTagResponse> | ShowTagResponse[]> {
		const results = await this.service.getMany(req);

		const ret = isArray(results)
			? results.map((tag) => new ShowTagResponse(tag))
			: {
					...results,
					data: results.data.map((tag) => new ShowTagResponse(tag)),
				};

		return ret;
	}

	@UseRolesGuard("admin")
	@Post()
	async create(@Body() dto: CreateTagDTO): Promise<ShowTagResponse> {
		/*TODO
      	- typeORM에서 발샌한 오류를 처리하는 ExceptionFilter 구현하기
        - 오류 status 마다 동작 사항 핸들러 정의하기
          예시) error.code === '23505' 인 경우, ServiceException을 발생시켜서 사용자에가 정보 알리기
        -
   		*/
		const search_name = dto.name.trim().split(/\s+/).join("_").toUpperCase();
		const newTag: Tag = await this.service.insertCreateDtoToQueue({ ...dto, search_name });

		return new ShowTagResponse(newTag);
	}

	@UseRolesGuard("admin")
	@Put()
	async replace(@Body() dto: ReplaceTagDTO): Promise<ShowTagResponse> {
		const existedEntity: Tag | null = await this.service.findOne({ where: { name: dto.name } });

		/*TODO : API 로직 가독성 높이기
		 -[] DB 제약 조건과 중복되는 로직을 제거하고, TypeORM 로직 예외처리를 ExceptionFilter이 포워딩하여 응답하기 
		*/
		if (existedEntity) {
			throw new ServiceException("DB_CONFLICT", "CONFLICT", `${dto.name} is already exist`);
		}

		const tag = await this.service.replaceOne({} as CrudRequest, {
			...dto,
			search_name: dto.name.trim().split(/\s+/).join("_").toUpperCase(),
		});

		return new ShowTagResponse(tag);
	}

	@Override("deleteOneBase")
	@UseRolesGuard("admin")
	async deleteOne(@ParsedRequest() req: CrudRequest) {
		await this.service.deleteOne(req);
	}
}
