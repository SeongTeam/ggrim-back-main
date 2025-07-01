import { IsDate, IsOptional, IsString, IsUrl } from "class-validator";

export class CreateArtistDTO {
	@IsString()
	name!: string;

	@IsOptional()
	@IsDate()
	birth_date!: Date;

	@IsOptional()
	@IsDate()
	death_date!: Date;

	@IsOptional()
	@IsUrl()
	info_url!: string;

	@IsOptional()
	@IsUrl()
	image_url!: string;
}
