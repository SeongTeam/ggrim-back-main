import { Transform } from "class-transformer";
import { IsNumber } from "class-validator";
import { IsOptionalProperty } from "../../../_common/decorator/swagger/class-validator/isOptionalProperty";
import { ApiProperty } from "@nestjs/swagger";

export class QuizReactionQueryDTO {
	@ApiProperty({ default: 0 })
	@Transform(({ value }) => (isNaN(Number(value)) ? 0 : Number(value)))
	@IsOptionalProperty()
	@IsNumber()
	page: number = 0;
}
