import { PickType } from "@nestjs/swagger";
import { IsString } from "class-validator";
import { requestVerificationDTO } from "./requestVerification.dto";

export class VerifyDTO extends PickType(requestVerificationDTO, ["email"]) {
	@IsString()
	pinCode!: string;
}
