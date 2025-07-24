import { IsEmail } from "class-validator";
import { IsInArray } from "../../../../utils/classValidator";
import { OneTimeTokenPurpose, OneTimeTokenPurposeValues } from "../../entity/oneTimeToken.entity";

export class SendOneTimeTokenDTO {
	@IsEmail()
	email!: string;

	@IsInArray([
		OneTimeTokenPurposeValues.UPDATE_PASSWORD,
		OneTimeTokenPurposeValues.RECOVER_ACCOUNT,
	])
	purpose!: OneTimeTokenPurpose;
}
