import { IsEmail } from "class-validator";
import { IsInArray } from "../../utils/class-validator";
import { OneTimeTokenPurpose, OneTimeTokenPurposeValues } from "../entity/one-time-token.entity";

export class SendOneTimeTokenDTO {
	@IsEmail()
	email!: string;

	@IsInArray([
		OneTimeTokenPurposeValues.UPDATE_PASSWORD,
		OneTimeTokenPurposeValues.RECOVER_ACCOUNT,
	])
	purpose!: OneTimeTokenPurpose;
}
