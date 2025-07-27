import { IsEmail } from "class-validator";
import { IsInArray } from "../../../../utils/classValidator";
import { OneTimeTokenPurpose, OneTimeTokenPurposeValues } from "../../entity/oneTimeToken.entity";
import { ApiProperty } from "@dataui/crud/lib/crud";

export class SendOneTimeTokenDTO {
	@IsEmail()
	email!: string;

	@ApiProperty({
		enum: [
			OneTimeTokenPurposeValues.UPDATE_PASSWORD,
			OneTimeTokenPurposeValues.RECOVER_ACCOUNT,
		],
	})
	@IsInArray([
		OneTimeTokenPurposeValues.UPDATE_PASSWORD,
		OneTimeTokenPurposeValues.RECOVER_ACCOUNT,
	])
	purpose!: OneTimeTokenPurpose;
}
