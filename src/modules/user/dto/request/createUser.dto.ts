import { IsString, MaxLength, MinLength } from "class-validator";
import { IsOptionalProperty } from "../../../_common/decorator/swagger/class-validator/isOptionalProperty";

export class CreateUserDTO {
	@IsString()
	@MinLength(8)
	@MaxLength(30)
	password!: string;

	// @IsInArray(['admin', 'user'])
	// role!: UserRole;

	@IsString()
	@MinLength(4)
	@MaxLength(12)
	username!: string;

	@IsOptionalProperty()
	oauth_provider?: string;

	@IsOptionalProperty()
	oauth_provider_id?: string;
}
