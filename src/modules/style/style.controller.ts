import {
	Crud,
	CrudController,
	CrudRequest,
	GetManyDefaultResponse,
	Override,
	ParsedBody,
	ParsedRequest,
} from "@dataui/crud";
import { Controller, Get, Param, ParseUUIDPipe } from "@nestjs/common";

import { CreateStyleDTO } from "./dto/request/createStyle.dto";
import { ReplaceStyleDTO } from "./dto/request/replaceStyle.dto";
import { Style } from "./entities/style.entity";
import { StyleService } from "./style.service";
import { ShowStyleResponse } from "./dto/response/showStyle.response";
import { isArray } from "class-validator";
import { ApiOverride } from "../_common/decorator/swagger/CRUD/apiOverride";
import { UseRolesGuard } from "../auth/guard/decorator/authorization";
import { ServiceException } from "../_common/filter/exception/service/serviceException";

/*TODO
- soft-deleted 상태인 데이터가 replace method 사용시 수정되는 것이 위험한지 고민하기
*/
@Crud({
	model: {
		type: Style,
	},
	params: {
		id: {
			field: "id",
			type: "uuid",
			primary: true,
		},
	},
	routes: {
		only: ["getManyBase", "createOneBase", "replaceOneBase", "deleteOneBase"],
	},
	dto: {
		create: CreateStyleDTO,
		replace: ReplaceStyleDTO,
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
@Controller("painting/style")
export class StyleController implements CrudController<Style> {
	constructor(public service: StyleService) {}

	get base(): CrudController<Style> {
		return this;
	}

	/**
	 * Retrieve single Style by id.
	 *
	 */

	@Get(":id")
	async getOne(@Param("id", ParseUUIDPipe) id: string): Promise<ShowStyleResponse> {
		const style = await this.service.findOne({
			where: { id },
			relations: { paintings: true },
		});
		if (!style) throw new ServiceException("ENTITY_NOT_FOUND", "BAD_REQUEST");
		return new ShowStyleResponse(style);
	}

	/**
	 * Retrieve multiple Styles.
	 *
	 * @remarks
	 * use join field, If want Painting[]. you can filter by painting properties like id, title and image_url
	 *
	 * Example:
	 * ```
	 * GET backend/style?s={"name":{"$cont":"female"}}&join=paintings
	 * ```
	 *
	 *
	 */

	@ApiOverride("getManyBase", ShowStyleResponse)
	async getMany(
		@ParsedRequest() req: CrudRequest,
	): Promise<GetManyDefaultResponse<ShowStyleResponse> | ShowStyleResponse[]> {
		const results = await this.service.getMany(req);

		const ret = isArray(results)
			? results.map((style) => new ShowStyleResponse(style))
			: {
					...results,
					data: results.data.map((style) => new ShowStyleResponse(style)),
				};

		return ret;
	}

	@ApiOverride("createOneBase", ShowStyleResponse)
	@UseRolesGuard("admin")
	async createOne(
		@ParsedRequest() req: CrudRequest,
		@ParsedBody() dto: CreateStyleDTO,
	): Promise<ShowStyleResponse> {
		const { name } = dto;
		const search_name = name.trim().split(/\s+/).join("_").toUpperCase();
		const newStyle = await this.service.createOne(req, { search_name, ...dto });
		return new ShowStyleResponse(newStyle);
	}

	@ApiOverride("replaceOneBase", ShowStyleResponse)
	@UseRolesGuard("admin")
	async replaceOne(
		@ParsedRequest() req: CrudRequest,
		@ParsedBody() dto: ReplaceStyleDTO,
	): Promise<ShowStyleResponse> {
		const style = await this.service.replaceOne(req, {
			...dto,
			search_name: dto.name.trim().split(/\s+/).join("_").toUpperCase(),
		});

		return new ShowStyleResponse(style);
	}
	@Override("deleteOneBase")
	@UseRolesGuard("admin")
	async deleteOne(@ParsedRequest() req: CrudRequest) {
		await this.service.deleteOne(req);
	}
}
