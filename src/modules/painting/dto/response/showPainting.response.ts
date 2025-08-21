import { Painting } from "../../entities/painting.entity";
import { ShowTag } from "../../../tag/dto/response/showTag.response";
import { ShowArtist } from "../../../artist/dto/response/showArtist.response";
import { ShowStyle } from "../../../style/dto/response/showStyle.response";
import { ApiProperty } from "@nestjs/swagger";

export class ShowPainting {
	readonly id: string;
	readonly title: string;
	readonly image_url: string;
	readonly width: number;
	readonly height: number;

	public constructor(painting: Painting) {
		const { id, title, width, height, image_url } = painting;
		this.id = id;
		this.title = title;
		this.width = width;
		this.height = height;
		this.image_url = image_url;
	}
}

export class ShowPaintingResponse extends ShowPainting {
	readonly description: string;
	readonly completition_year: number;

	@ApiProperty({
		type: [ShowTag],
	})
	readonly showTags: ShowTag[];

	@ApiProperty({
		type: [ShowStyle],
	})
	readonly showStyles: ShowStyle[];

	@ApiProperty({
		type: ShowArtist,
	})
	readonly showArtist: ShowArtist;

	constructor(painting: Painting) {
		super(painting);
		this.description = painting.description;
		this.completition_year = painting.completition_year;
		this.showTags = painting.tags.map((t) => new ShowTag(t));
		this.showStyles = painting.styles.map((s) => new ShowStyle(s));
		this.showArtist = new ShowArtist(painting.artist);
	}
}
