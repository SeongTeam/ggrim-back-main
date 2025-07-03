import { IsString } from "class-validator";

export class CreateStyleDTO {
	@IsString()
	name!: string;
}
