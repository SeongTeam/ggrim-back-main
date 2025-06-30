import { PickType } from "@nestjs/mapped-types";
import { IsUrl } from "class-validator";
import { CreateTagDTO } from "./createTagDTO";

export class ReplaceTagDTO extends PickType(CreateTagDTO, ["name"]) {
	@IsUrl()
	info_url!: string;
}
