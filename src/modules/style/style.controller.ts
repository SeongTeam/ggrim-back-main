import {
	Crud,
	CrudController,
	CrudRequest,
	GetManyDefaultResponse,
	Override,
	ParsedBody,
	ParsedRequest,
} from "@dataui/crud";
import { Controller, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { TokenAuthGuard } from "../auth/guard/authentication/tokenAuth.guard";
import { RolesGuard } from "../auth/guard/authorization/roles.guard";
import { Roles } from "../user/metadata/role";
import { CreateStyleDTO } from "./dto/request/createStyle.dto";
import { ReplaceStyleDTO } from "./dto/request/replaceStyle.dto";
import { Style } from "./entities/style.entity";
import { StyleService } from "./style.service";
import { ShowStyleResponse } from "./dto/response/showStyle.response";
import { isArray } from "class-validator";
import { ApiOverride } from "../_common/decorator/swagger/CRUD/apiOverride";

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
		only: ["getOneBase", "getManyBase", "createOneBase", "replaceOneBase", "deleteOneBase"],
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
@UsePipes(new ValidationPipe({ transform: true }))
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

	@ApiOverride("getOneBase", ShowStyleResponse)
	async getOne(req: CrudRequest): Promise<ShowStyleResponse> {
		const style = await this.service.getOne(req);
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
	@Roles("admin")
	@UseGuards(TokenAuthGuard, RolesGuard)
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
	@Roles("admin")
	@UseGuards(TokenAuthGuard, RolesGuard)
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
	@Roles("admin")
	@UseGuards(TokenAuthGuard, RolesGuard)
	async deleteOne(@ParsedRequest() req: CrudRequest) {
		await this.service.deleteOne(req);
	}
}
