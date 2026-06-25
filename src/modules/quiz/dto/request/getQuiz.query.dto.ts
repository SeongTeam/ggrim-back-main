import { IsBoolean, IsNumber } from "class-validator";
import { IsOptionalProperty } from "../../../_common/decorator/swagger/class-validator/isOptionalProperty";
import { Transform } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";
import { transformToId } from "../../../../utils/obfuscate";

export class GetQuizQueryDTO {
	/**
	 * @description this field always transform invalid value or type into default value
	 */
	@ApiProperty({ default: false })
	@Transform(({ value }) => (value === "true" ? true : false))
	@IsOptionalProperty()
	@IsBoolean()
	isS3Access: boolean = false;

	@IsOptionalProperty()
	@Transform(({ value }) => transformToId(value))
	@IsNumber({ allowInfinity: false, allowNaN: false })
	userId?: number;
}
