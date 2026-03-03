import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsArray, IsBoolean, IsUUID } from "class-validator";
import { IsOptionalProperty } from "../../../_common/decorator/swagger/class-validator/isOptionalProperty";

export class GetByIdsQueryDTO {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-return
	@Transform(({ value }) => (Array.isArray(value) ? value : [value]))
	@IsArray()
	@IsUUID("all", { each: true })
	ids!: string[];

	@ApiProperty({ default: false })
	@Transform(({ value }) => (value === "true" ? true : false))
	@IsOptionalProperty()
	@IsBoolean()
	isS3Access: boolean = false;
}
