import { Painting } from "../../entities/painting.entity";
import { ShowTagResponse } from "../../../tag/dto/response/showTag.response";
import { ShowArtistResponse } from "../../../artist/dto/response/showArtist.response";
import { ShowStyleResponse } from "../../../style/dto/response/showStyle.response";
import { ApiExtraModels, ApiProperty, OmitType } from "@nestjs/swagger";

class ShowTag extends OmitType(ShowTagResponse, ["shortPaintings"] as const) {}
class ShowStyle extends OmitType(ShowStyleResponse, ["shortPaintings"] as const) {}
class ShowArtist extends OmitType(ShowArtistResponse, ["shortPaintings"] as const) {}

@ApiExtraModels(ShowTagResponse)
export class ShowPaintingResponse {
	readonly id: string;
	readonly title: string;
	readonly image_url: string;
	readonly description: string;
	readonly completition_year: number;
	readonly width: number;
	readonly height: number;

	@ApiProperty({
		type: [ShowTag],
	})
	readonly showTags?: ShowTag[];

	@ApiProperty({
		type: [ShowStyle],
	})
	readonly showStyles?: ShowStyle[];

	@ApiProperty({
		type: [ShowArtist],
	})
	readonly showArtist?: ShowArtist;

	constructor(painting: Painting) {
		this.id = painting.id;
		this.title = painting.title;
		this.image_url = painting.image_url;
		this.description = painting.description;
		this.completition_year = painting.completition_year;
		this.width = painting.width;
		this.height = painting.height;
		this.showTags = painting.tags?.map((t) => new ShowTagResponse(t));
		this.showStyles = painting.styles?.map((s) => new ShowStyleResponse(s));
		this.showArtist = new ShowArtistResponse(painting.artist);
	}
}
