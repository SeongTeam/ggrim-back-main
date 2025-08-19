import { IsInArray } from "../../../../utils/classValidator";
import { OneTimeTokenPurpose } from "../../types/oneTimeToken";
import { ONE_TIME_TOKEN_PURPOSE } from "../../const";
import { ApiProperty } from "@nestjs/swagger";

export class CreateOneTimeTokenDTO {
	@ApiProperty({ enum: Object.values(ONE_TIME_TOKEN_PURPOSE) })
	@IsInArray(Object.values(ONE_TIME_TOKEN_PURPOSE))
	purpose!: OneTimeTokenPurpose;
}
