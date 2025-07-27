import { ApiProperty } from "@dataui/crud/lib/crud";
import { IsInArray } from "../../../../utils/classValidator";
import { OneTimeTokenPurpose, OneTimeTokenPurposeValues } from "../../entity/oneTimeToken.entity";

export class CreateOneTimeTokenDTO {
	@ApiProperty({ enum: Object.values(OneTimeTokenPurposeValues) })
	@IsInArray(Object.values(OneTimeTokenPurposeValues))
	purpose!: OneTimeTokenPurpose;
}
