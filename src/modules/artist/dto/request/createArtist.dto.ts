import { IsDate, IsString, IsUrl } from "class-validator";
import { IsOptionalProperty } from "../../../_common/decorator/swagger/class-validator/isOptionalProperty";

export class CreateArtistDTO {
	@IsString()
	name!: string;

	@IsOptionalProperty()
	@IsDate()
	birth_date!: Date;

	@IsOptionalProperty()
	@IsDate()
	death_date!: Date;

	@IsOptionalProperty()
	@IsUrl()
	info_url!: string;

	@IsOptionalProperty()
	@IsUrl()
	image_url!: string;
}
