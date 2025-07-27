import { Tag } from "../../entities/tag.entity";
import { ShortPaintingResponse } from "../../../painting/dto/response/shortPainting.response";

export class ShowTagResponse {
	readonly id: string;
	readonly name: string;
	readonly info_url: string | null;
	readonly shortPaintings: ShortPaintingResponse[];

	constructor(tag: Tag) {
		this.id = tag.id;
		this.name = tag.name;
		this.info_url = tag.info_url;
		this.shortPaintings = tag.paintings.map((p) => new ShortPaintingResponse(p));
	}
}
