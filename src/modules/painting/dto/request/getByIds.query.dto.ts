import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsArray, IsBoolean, IsNumber } from "class-validator";
import { IsOptionalProperty } from "../../../_common/decorator/swagger/class-validator/isOptionalProperty";
import { transformToId } from "../../../../utils/obfuscate";

export class GetByIdsQueryDTO {
	@ApiProperty({
		type: "string",
		isArray: true,
		description: "obfuscated ids like /path?ids=ac31&ads=scd1",
	})
	@Transform(
		({ value }) =>
			Array.isArray(value) ? value.map((v) => transformToId(v)) : [transformToId(value)],
		{
			toClassOnly: true,
		},
	)
	@IsArray()
	@IsNumber({ allowInfinity: false, allowNaN: false }, { each: true })
	ids!: number[];

	@ApiProperty({ default: false })
	@Transform(({ value }) => (value === "true" ? true : false))
	@IsOptionalProperty()
	@IsBoolean()
	isS3Access: boolean = false;
}
