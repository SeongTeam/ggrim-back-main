import { Verification } from "../../entity/verification.entity";

export class ShowVerificationResponse {
	readonly id: string;
	readonly verification_success_date: Date | null;
	readonly last_verified_date: Date | null;
	readonly pin_code: string;
	readonly pin_code_expired_date: Date;

	constructor(verification: Verification) {
		this.id = verification.id;
		this.verification_success_date = verification.verification_success_date;
		this.last_verified_date = verification.last_verified_date;
		this.pin_code = verification.pin_code;
		this.pin_code_expired_date = verification.pin_code_expired_date;
	}
}
