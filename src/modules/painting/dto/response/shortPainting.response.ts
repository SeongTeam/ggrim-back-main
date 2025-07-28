import { Painting } from "../../entities/painting.entity";

export class ShortPaintingResponse {
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
