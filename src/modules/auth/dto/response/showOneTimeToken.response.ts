import { ApiProperty } from "@nestjs/swagger";
import { OneTimeToken } from "../../entity/oneTimeToken.entity";
import { OneTimeTokenPurpose } from "../../types/oneTimeToken";
import { ONE_TIME_TOKEN_PURPOSE } from "../../const";

export class ShowOneTimeTokenResponse {
	readonly id: string;
	readonly token: string;
	readonly used_date: Date | null;
	readonly expired_date: Date;
	@ApiProperty({
		enum: Object.values(ONE_TIME_TOKEN_PURPOSE),
		enumName: "ONE_TIME_TOKEN_PURPOSE",
	})
	readonly purpose: OneTimeTokenPurpose;

	constructor(oneTimeToken: OneTimeToken) {
		this.id = oneTimeToken.id;
		this.token = oneTimeToken.token;
		this.used_date = oneTimeToken.used_date;
		this.expired_date = oneTimeToken.expired_date;
		this.purpose = oneTimeToken.purpose;
	}
}
