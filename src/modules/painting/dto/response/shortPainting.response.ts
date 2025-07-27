import { Painting } from "../../entities/painting.entity";

export class ShortPaintingResponse
	implements Pick<Painting, "id" | "title" | "image_url" | "width" | "height" | "image_s3_key">
{
	readonly id!: string;
	readonly title!: string;
	readonly image_url!: string;
	readonly width!: number;
	readonly height!: number;
	readonly image_s3_key: string;

	public constructor(painting: Painting) {
		const { id, title, width, height, image_url, image_s3_key } = painting;
		this.id = id;
		this.title = title;
		this.width = width;
		this.height = height;
		this.image_url = image_url;
		this.image_s3_key = image_s3_key;
	}
}
