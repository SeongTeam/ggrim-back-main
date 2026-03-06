import { ShowOneTimeTokenResponse } from "./showOneTimeToken.response";
import { OneTimeToken } from "../../entity/oneTimeToken.entity";
import { User } from "../../../user/entity/user.entity";
import { ShowUserResponse } from "../../../user/dto/request/response/showUser.response";

export class EmailVerificationTokenResponse {
	showOneTimeTokenResponse: ShowOneTimeTokenResponse;
	showUser: ShowUserResponse;
	constructor(oneTimeToken: OneTimeToken, user: User) {
		this.showOneTimeTokenResponse = new ShowOneTimeTokenResponse(oneTimeToken);
		this.showUser = new ShowUserResponse(user);
	}
}
