import { PickType } from "@nestjs/mapped-types";
import { IsString } from "class-validator";
import { requestVerificationDTO } from "./requestVerificationDTO";

export class VerifyDTO extends PickType(requestVerificationDTO, ["email"]) {
	@IsString()
	pinCode!: string;
}
