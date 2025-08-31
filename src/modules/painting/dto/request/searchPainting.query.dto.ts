import { IsArray, IsBoolean, IsNumber, IsString } from "class-validator";
import { IsOptionalProperty } from "../../../_common/decorator/swagger/class-validator/isOptionalProperty";
import { Transform } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

export class SearchPaintingQueryDTO {
	@IsOptionalProperty()
	@IsString()
	title: string = "";

	@IsOptionalProperty()
	@IsString()
	artistName: string = "";

	// eslint-disable-next-line @typescript-eslint/no-unsafe-return
	@Transform(({ value }) => (Array.isArray(value) ? value : [value]))
	@IsOptionalProperty()
	@IsArray()
	@IsString({ each: true })
	tags: string[] = [];

	// eslint-disable-next-line @typescript-eslint/no-unsafe-return
	@Transform(({ value }) => (Array.isArray(value) ? value : [value]))
	@IsOptionalProperty()
	@IsArray()
	@IsString({ each: true })
	styles: string[] = [];

	@ApiProperty({ default: false })
	@Transform(({ value }) => (value === "true" ? true : false))
	@IsOptionalProperty()
	@IsBoolean()
	isS3Access: boolean = false;

	@ApiProperty({ default: 0 })
	@Transform(({ value }) => (isNaN(Number(value)) ? 0 : Number(value)))
	@IsOptionalProperty()
	@IsNumber()
	page: number = 0;
}
