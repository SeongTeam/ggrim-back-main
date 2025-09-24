import { ApiProperty } from "@nestjs/swagger";
import { OneTimeToken } from "../../entity/oneTimeToken.entity";
import { OneTimeTokenPurpose } from "../../types/oneTimeToken";
import { ONE_TIME_TOKEN_PURPOSE } from "../../const";

export class HashedOneTimeTokenResponse {
	readonly id: string;
	readonly hashedToken: string;

	/**
	 * @format IsoDateTime
	 * @example 2011-10-05T14:48:00.000Z
	 */
	readonly used_date: string | null;

	/**
	 * @format IsoDateTime
	 * @example 2011-10-05T14:48:00.000Z
	 */
	readonly expired_date: string;
	@ApiProperty({
		enum: Object.values(ONE_TIME_TOKEN_PURPOSE),
		enumName: "ONE_TIME_TOKEN_PURPOSE",
	})
	readonly purpose: OneTimeTokenPurpose;

	constructor(oneTimeToken: OneTimeToken) {
		this.id = oneTimeToken.id;
		this.hashedToken = oneTimeToken.token;
		this.used_date = oneTimeToken.used_date ? oneTimeToken.used_date.toISOString() : null;
		this.expired_date = oneTimeToken.expired_date.toISOString();
		this.purpose = oneTimeToken.purpose;
	}
}
