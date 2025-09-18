import { IsArray, IsNumber, IsString, Min } from "class-validator";
import { IsOptionalProperty } from "../../../_common/decorator/swagger/class-validator/isOptionalProperty";
import { Transform } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

export class SearchQuizQueryDTO {
	/**
	 * @description follow openapi query serialization spec.
	 * @example /route?artists=name1
	 * @example /route?artists=name1&artists=name2
	 */
	// eslint-disable-next-line @typescript-eslint/no-unsafe-return
	@Transform(({ value }) => (Array.isArray(value) ? value : [value]))
	@IsOptionalProperty()
	@IsArray()
	@IsString({ each: true })
	artists: string[] = [];

	/**
	 * @description follow openapi query serialization spec.
	 * @example /route?tags=name1
	 * @example /route?tags=name1&tags=name2
	 */
	// eslint-disable-next-line @typescript-eslint/no-unsafe-return
	@Transform(({ value }) => (Array.isArray(value) ? value : [value]))
	@IsOptionalProperty()
	@IsArray()
	@IsString({ each: true })
	tags: string[] = [];

	/**
	 * @description follow openapi query serialization spec.
	 * @example /route?styles=name1
	 * @example /route?styles=name1&tags=name2
	 */
	// eslint-disable-next-line @typescript-eslint/no-unsafe-return
	@Transform(({ value }) => (Array.isArray(value) ? value : [value]))
	@IsOptionalProperty()
	@IsArray()
	@IsString({ each: true })
	styles: string[] = [];

	@ApiProperty({ default: 0 })
	@Transform(({ value }) => (isNaN(Number(value)) ? 0 : Number(value)))
	@IsOptionalProperty()
	@Min(0)
	@IsNumber()
	page: number = 0;

	@ApiProperty({ default: 20 })
	@Transform(({ value }) => (isNaN(Number(value)) ? 20 : Number(value)))
	@IsOptionalProperty()
	@IsNumber()
	count: number = 20;
}
