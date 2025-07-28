import { ShowUserResponse } from "../../../user/dto/request/response/showUser.response";
import { User } from "../../../user/entity/user.entity";

export class SignInResponse {
	accessToken: string;
	refreshToken: string;
	user: ShowUserResponse;

	constructor(access: string, refresh: string, user: User) {
		this.accessToken = access;
		this.refreshToken = refresh;
		this.user = new ShowUserResponse(user);
	}
}
