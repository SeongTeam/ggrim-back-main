import { PickType } from "@nestjs/swagger";
import { IsUrl } from "class-validator";
import { CreateTagDTO } from "./createTag.dto";

export class ReplaceTagDTO extends PickType(CreateTagDTO, ["name"]) {
	@IsUrl()
	info_url!: string;
}
