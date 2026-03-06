import { ShowOneTimeTokenResponse } from "./showOneTimeToken.response";
import { OneTimeToken } from "../../entity/oneTimeToken.entity";
import { User } from "../../../user/entity/user.entity";
import { ShowUserResponse } from "../../../user/dto/request/response/showUser.response";

export class EmailVerificationTokenResponse {
	oneTimeToken: ShowOneTimeTokenResponse;
	user: ShowUserResponse;
	constructor(oneTimeToken: OneTimeToken, user: User) {
		this.oneTimeToken = new ShowOneTimeTokenResponse(oneTimeToken);
		this.user = new ShowUserResponse(user);
	}
}
