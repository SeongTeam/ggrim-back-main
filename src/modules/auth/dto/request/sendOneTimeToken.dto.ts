import { IsEmail } from "class-validator";
import { IsInArray } from "../../../../utils/classValidator";
import { OneTimeTokenPurpose } from "../../types/oneTimeToken";
import { ONE_TIME_TOKEN_PURPOSE } from "../../const";
import { ApiProperty } from "@dataui/crud/lib/crud";

export class SendOneTimeTokenDTO {
	@IsEmail()
	email!: string;

	@ApiProperty({
		enum: [ONE_TIME_TOKEN_PURPOSE.UPDATE_PASSWORD, ONE_TIME_TOKEN_PURPOSE.RECOVER_ACCOUNT],
	})
	@IsInArray([ONE_TIME_TOKEN_PURPOSE.UPDATE_PASSWORD, ONE_TIME_TOKEN_PURPOSE.RECOVER_ACCOUNT])
	purpose!: OneTimeTokenPurpose;
}
