import {
	Crud,
	CrudController,
	CrudRequest,
	Override,
	ParsedBody,
	ParsedRequest,
} from "@dataui/crud";
import { Controller, UseGuards } from "@nestjs/common";
import { TokenAuthGuard } from "../auth/guard/authentication/tokenAuth.guard";
import { RolesGuard } from "../auth/guard/authorization/roles.guard";
import { Roles } from "../user/metadata/role";
import { ArtistService } from "./artist.service";
import { CreateArtistDTO } from "./dto/request/createArtistDTO";
import { Artist } from "./entities/artist.entity";
const EXCLUDED_COLUMN = ["created_date", "updated_date", "deleted_date", "version"] as const;
@Crud({
	model: {
		type: Artist,
	},
	routes: {
		only: ["getOneBase", "getManyBase", "createOneBase", "replaceOneBase", "deleteOneBase"],
	},
	params: {
		id: {
			field: "id",
			type: "uuid",
			primary: true,
		},
	},
	dto: {
		create: CreateArtistDTO,
		replace: CreateArtistDTO,
	},
	query: {
		allow: ["id", "name", "info_url", "birth_date", "death_date", "search_name"],
		exclude: [...EXCLUDED_COLUMN],
		join: {
			paintings: {
				eager: false,
				allow: ["id", "title"], // TODO allow 옵션 적용안되는 버그 수정하기
				persist: ["id", "title", "image_url"],
				exclude: [
					...EXCLUDED_COLUMN,
					"width",
					"height",
					"completition_year",
					"description",
				],
			},
		},
		softDelete: true,
		alwaysPaginate: true,
	},
})
@Controller("artist")
export class ArtistController implements CrudController<Artist> {
	constructor(public service: ArtistService) {}

	@Override("createOneBase")
	@Roles("admin")
	@UseGuards(TokenAuthGuard, RolesGuard)
	async createOne(@ParsedRequest() req: CrudRequest, @ParsedBody() dto: CreateArtistDTO) {
		const { name } = dto;
		const search_name = name.trim().split(/\s+/).join("_").toUpperCase();
		return this.service.createOne(req, { search_name, ...dto });
	}

	@Override("replaceOneBase")
	@Roles("admin")
	@UseGuards(TokenAuthGuard, RolesGuard)
	async replaceOne(@ParsedRequest() req: CrudRequest, @ParsedBody() dto: CreateArtistDTO) {
		const search_name = dto.name.trim().split(/\s+/).join("_").toUpperCase();
		return this.service.replaceOne(req, { ...dto, search_name });
	}
	@Override("deleteOneBase")
	@Roles("admin")
	@UseGuards(TokenAuthGuard, RolesGuard)
	async deleteOne(@ParsedRequest() req: CrudRequest) {
		return this.service.deleteOne(req);
	}
}
