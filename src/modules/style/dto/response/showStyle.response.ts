import { ShortPaintingResponse } from "../../../painting/dto/response/shortPainting.response";
import { Style } from "../../entities/style.entity";

export class ShowStyleResponse {
	readonly id: string;
	readonly name: string;
	readonly info_url: string | null;

	readonly shortPaintings?: ShortPaintingResponse[];

	constructor(style: Style) {
		this.id = style.id;
		this.name = style.name;
		this.info_url = style.info_url;
		this.shortPaintings = style.paintings?.map((p) => new ShortPaintingResponse(p));
	}
}
