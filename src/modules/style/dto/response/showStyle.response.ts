import { ShowPainting } from "../../../painting/dto/response/showPainting.response";
import { Style } from "../../entities/style.entity";

export class ShowStyle {
	readonly id: string;
	readonly name: string;
	readonly info_url: string | null;
	constructor(style: Style) {
		this.id = style.id;
		this.name = style.name;
		this.info_url = style.info_url;
	}
}

export class ShowStyleResponse extends ShowStyle {
	readonly shortPaintings?: ShowPainting[];

	constructor(style: Style) {
		super(style);
		this.shortPaintings = style.paintings?.map((p) => new ShowPainting(p));
	}
}
