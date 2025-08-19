import { IsBoolean, IsUUID } from "class-validator";
import { IsOptionalProperty } from "../../../_common/decorator/swagger/class-validator/isOptionalProperty";
import { Transform } from "class-transformer";
import { ApiProperty } from "@dataui/crud/lib/crud";

export class GetQuizQueryDTO {
	@ApiProperty({ default: false })
	@Transform(({ value }) => (value === "true" ? true : false))
	@IsOptionalProperty()
	@IsBoolean()
	isS3Access!: boolean;

	@IsOptionalProperty()
	@IsUUID()
	userId?: string;
}
