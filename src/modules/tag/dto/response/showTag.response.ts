import { ShowPainting } from "../../../painting/dto/response/showPainting.response";
import { Tag } from "../../entities/tag.entity";

export class ShowTag {
	readonly id: string;
	readonly name: string;
	readonly info_url: string | null;

	constructor(tag: Tag) {
		this.id = tag.id;
		this.name = tag.name;
		this.info_url = tag.info_url;
	}
}

export class ShowTagResponse extends ShowTag {
	readonly shortPaintings?: ShowPainting[];

	constructor(tag: Tag) {
		super(tag);
		this.shortPaintings = tag.paintings?.map((p) => new ShowPainting(p));
	}
}
