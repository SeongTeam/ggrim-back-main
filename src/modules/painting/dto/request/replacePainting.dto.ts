import { PickType } from "@nestjs/swagger";
import { IsArray, IsString } from "class-validator";
import { CreatePaintingDTO } from "./createPainting.dto";
import { Transform } from "class-transformer";

export class ReplacePaintingDTO extends PickType(CreatePaintingDTO, [
	"title",
	"image_url",
	"description",
	"width",
	"height",
	"completition_year",
	"artistName",
	"image_s3_key",
]) {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-return
	@Transform(({ value }) => (Array.isArray(value) ? value : [value]))
	@IsArray()
	@IsString({ each: true })
	tags!: string[];

	// eslint-disable-next-line @typescript-eslint/no-unsafe-return
	@Transform(({ value }) => (Array.isArray(value) ? value : [value]))
	@IsArray()
	@IsString({ each: true })
	styles!: string[];
}
