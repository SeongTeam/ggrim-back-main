import { ShortPaintingResponse } from "../../../painting/dto/response/shortPainting.response";
import { Artist } from "../../entities/artist.entity";

export class ShowArtistResponse {
	readonly id: string;

	readonly name: string;

	readonly image_url: string;

	readonly birth_date: Date;

	readonly death_date: Date;

	readonly info_url: string;

	readonly shortPaintings?: ShortPaintingResponse[];

	constructor(artist: Artist) {
		this.id = artist.id;
		this.name = artist.name;
		this.image_url = artist.image_url;
		this.birth_date = artist.birth_date;
		this.death_date = artist.death_date;
		this.info_url = artist.info_url;
		this.shortPaintings = artist.paintings?.map((p) => new ShortPaintingResponse(p));
	}
}
