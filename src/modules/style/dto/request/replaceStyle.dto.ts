import { PickType } from "@nestjs/swagger";
import { IsUrl } from "class-validator";
import { CreateStyleDTO } from "./createStyle.dto";

export class ReplaceStyleDTO extends PickType(CreateStyleDTO, ["name"]) {
	@IsUrl()
	info_url!: string;
}
