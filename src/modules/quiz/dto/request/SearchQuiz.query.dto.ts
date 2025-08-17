import { IsArray, IsNumber, IsString } from "class-validator";
import { IsOptionalProperty } from "../../../_common/decorator/swagger/class-validator/isOptionalProperty";
import { Transform } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

export class SearchQuizQueryDTO {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-return
	@Transform(({ value }) => (Array.isArray(value) ? value : [value]))
	@IsOptionalProperty()
	@IsArray()
	@IsString({ each: true })
	artists: string[] = [];

	/*형식 
      JSON 문자열 
        - 예시) url?tags=["1","2"]
        - 서버쪽에서 파싱 로직을 사용해야함
      */

	// eslint-disable-next-line @typescript-eslint/no-unsafe-return
	@Transform(({ value }) => (Array.isArray(value) ? value : [value]))
	@IsOptionalProperty()
	@IsArray()
	@IsString({ each: true })
	tags: string[] = [];

	/*형식 
      JSON 문자열 
        - 예시) url?tags=["1","2"]
        - 서버쪽에서 파싱 로직을 사용해야함
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
	@IsNumber()
	page!: number;

	@ApiProperty({ default: 20 })
	@Transform(({ value }) => (isNaN(Number(value)) ? 20 : Number(value)))
	@IsOptionalProperty()
	@IsNumber()
	count!: number;
}
