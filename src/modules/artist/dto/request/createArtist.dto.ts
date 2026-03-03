import { IsDate, IsString, IsUrl } from "class-validator";
import { IsOptionalProperty } from "../../../_common/decorator/swagger/class-validator/isOptionalProperty";
import { Type } from "class-transformer";

export class CreateArtistDTO {
	@IsString()
	name!: string;

	@IsOptionalProperty()
	@Type(() => Date)
	@IsDate()
	birth_date?: Date;

	@IsOptionalProperty()
	@Type(() => Date)
	@IsDate()
	death_date?: Date;

	@IsOptionalProperty()
	@IsUrl()
	info_url?: string;

	@IsOptionalProperty()
	@IsUrl()
	image_url?: string;
}
