import {
	Crud,
	CrudController,
	CrudRequest,
	Override,
	ParsedBody,
	ParsedRequest,
} from "@dataui/crud";
import { Controller, Get, Param, ParseUUIDPipe } from "@nestjs/common";
import { ArtistService } from "./artist.service";
import { CreateArtistDTO } from "./dto/request/createArtist.dto";
import { Artist } from "./entities/artist.entity";
import { ShowArtistResponse } from "./dto/response/showArtist.response";
import { isArray } from "class-validator";
import { ApiOverride } from "../_common/decorator/swagger/CRUD/apiOverride";
import { UseRolesGuard } from "../auth/guard/decorator/authorization";
import { ServiceException } from "../_common/filter/exception/service/serviceException";
import { Pagination } from "../_common/types";
@Crud({
	model: {
		type: Artist,
	},
	routes: {
		only: ["getManyBase", "createOneBase", "replaceOneBase", "deleteOneBase"],
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
@Controller("artist")
export class ArtistController implements CrudController<Artist> {
	constructor(public service: ArtistService) {}

	/**
	 * Retrieve Artist by id.
	 *
	 */

	@Get(":id")
	async getOne(@Param("id", ParseUUIDPipe) id: string): Promise<ShowArtistResponse> {
		const artist = await this.service.findOne({
			where: { id },
			relations: { paintings: true },
		});
		if (!artist) throw new ServiceException("ENTITY_NOT_FOUND", "BAD_REQUEST");

		return new ShowArtistResponse(artist);
	}

	/**
	 * Retrieve multiple Artist
	 *
	 * @remarks
	 * use join field, If want Painting[]. you can filter by painting properties id, title and image_url
	 *
	 * Example:
	 * ```
	 * GET backend/artist?s={"name":{"$cont":"Leonardo"}}&join=paintings
	 * ```
	 *
	 *
	 */

	@ApiOverride("getManyBase", ShowArtistResponse)
	async getMany(
		@ParsedRequest() req: CrudRequest,
	): Promise<Pagination<ShowArtistResponse> | ShowArtistResponse[]> {
		const results = await this.service.getMany(req);

		const ret = isArray(results)
			? results.map((artist) => new ShowArtistResponse(artist))
			: {
					...results,
					data: results.data.map((artist) => new ShowArtistResponse(artist)),
				};

		return ret;
	}

	@ApiOverride("createOneBase", ShowArtistResponse)
	@UseRolesGuard("admin")
	async createOne(
		@ParsedRequest() req: CrudRequest,
		@ParsedBody() dto: CreateArtistDTO,
	): Promise<ShowArtistResponse> {
		const { name } = dto;
		const search_name = name.trim().split(/\s+/).join("_").toUpperCase();
		const newArtist = await this.service.createOne(req, { search_name, ...dto });

		return new ShowArtistResponse(newArtist);
	}

	@ApiOverride("replaceOneBase", ShowArtistResponse)
	@UseRolesGuard("admin")
	async replaceOne(
		@ParsedRequest() req: CrudRequest,
		@ParsedBody() dto: CreateArtistDTO,
	): Promise<ShowArtistResponse> {
		const artist = await this.service.replaceOne(req, {
			...dto,
			search_name: dto.name.trim().split(/\s+/).join("_").toUpperCase(),
		});
		return new ShowArtistResponse(artist);
	}
	@Override("deleteOneBase")
	@UseRolesGuard("admin")
	async deleteOne(@ParsedRequest() req: CrudRequest) {
		await this.service.deleteOne(req);
		return;
	}
}
