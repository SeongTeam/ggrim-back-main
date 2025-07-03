import { User } from "../../../user/entity/user.entity";

export class SignInResponse {
	accessToken: string;
	refreshToken: string;
	user: User;

	constructor(access: string, refresh: string, user: User) {
		this.accessToken = access;
		this.refreshToken = refresh;
		this.user = user;
	}
}
