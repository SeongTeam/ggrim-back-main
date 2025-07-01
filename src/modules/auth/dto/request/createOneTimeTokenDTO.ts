import { IsInArray } from "../../../../utils/classValidator";
import { OneTimeTokenPurpose, OneTimeTokenPurposeValues } from "../../entity/oneTimeToken.entity";

export class CreateOneTimeTokenDTO {
	@IsInArray(Object.values(OneTimeTokenPurposeValues))
	purpose!: OneTimeTokenPurpose;
}
