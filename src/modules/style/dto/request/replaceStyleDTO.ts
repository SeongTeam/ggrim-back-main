import { PickType } from "@nestjs/mapped-types";
import { IsUrl } from "class-validator";
import { CreateStyleDTO } from "./createStyleDTO";

export class ReplaceStyleDTO extends PickType(CreateStyleDTO, ["name"]) {
	@IsUrl()
	info_url!: string;
}
