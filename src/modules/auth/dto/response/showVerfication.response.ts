import { Verification } from "../../entity/verification.entity";

export class ShowVerificationResponse {
	readonly id: string;

	/**
	 * @format IsoDateTime
	 * @example 2011-10-05T14:48:00.000Z
	 */
	readonly verification_success_date: string | null;
	readonly last_verified_date: string | null;
	readonly hashedPinCode: string;
	readonly pin_code_expired_date: string;

	constructor(verification: Verification) {
		this.id = verification.id;
		this.verification_success_date = verification.verification_success_date
			? verification.verification_success_date.toISOString()
			: null;
		this.last_verified_date = verification.last_verified_date
			? verification.last_verified_date.toISOString()
			: null;
		this.hashedPinCode = verification.pin_code;
		this.pin_code_expired_date = verification.pin_code_expired_date.toISOString();
	}
}
