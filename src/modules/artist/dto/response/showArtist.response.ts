import { ShowPainting } from "../../../painting/dto/response/showPainting.response";
import { Artist } from "../../entities/artist.entity";

export class ShowArtist {
	readonly id: string;

	readonly name: string;

	readonly image_url: string | null;

	/**
	 * @format IsoDateTime
	 * @example 2011-10-05T14:48:00.000Z
	 */
	readonly birth_date: string | null;

	/**
	 * @format IsoDateTime
	 * @example 2011-10-05T14:48:00.000Z
	 */
	readonly death_date: string | null;

	readonly info_url: string | null;

	constructor(artist: Artist) {
		this.id = artist.id;
		this.name = artist.name;
		this.image_url = artist.image_url;
		this.birth_date = artist.birth_date ? artist.birth_date.toISOString() : null;
		this.death_date = artist.death_date ? artist.death_date.toISOString() : null;
		this.info_url = artist.info_url;
	}
}

export class ShowArtistResponse extends ShowArtist {
	readonly shortPaintings: ShowPainting[];

	constructor(artist: Artist) {
		super(artist);
		this.shortPaintings = artist.paintings
			? artist.paintings.map((p) => new ShowPainting(p))
			: [];
	}
}
