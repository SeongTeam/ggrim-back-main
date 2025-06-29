import { IsString } from "class-validator";

export class CreateTagDTO {
	@IsString()
	name!: string;
}
