import { ShowPainting } from "../../../painting/dto/response/showPainting.response";
import { Artist } from "../../entities/artist.entity";

export class ShowArtist {
	readonly id: string;

	readonly name: string;

	readonly image_url: string;

	readonly birth_date: Date;

	readonly death_date: Date;

	readonly info_url: string;

	constructor(artist: Artist) {
		this.id = artist.id;
		this.name = artist.name;
		this.image_url = artist.image_url;
		this.birth_date = artist.birth_date;
		this.death_date = artist.death_date;
		this.info_url = artist.info_url;
	}
}

export class ShowArtistResponse extends ShowArtist {
	readonly shortPaintings: ShowPainting[];

	constructor(artist: Artist) {
		super(artist);
		this.shortPaintings = artist.paintings.map((p) => new ShowPainting(p));
	}
}
