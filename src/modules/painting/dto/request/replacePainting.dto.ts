import { PickType } from "@nestjs/swagger";
import { IsArray, IsString } from "class-validator";
import { CreatePaintingDTO } from "./createPainting.dto";
import { Transform } from "class-transformer";

//TODO : replace 로직 개선하기
// [ ] : 모든 tag 제거 가능하도록 수정
// [ ] : 모든 style 제거 가능하도록 수정
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
