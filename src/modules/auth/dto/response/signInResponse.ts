import { User } from "../../../user/entity/user.entity";

export interface SignInResponse {
	accessToken: string;
	refreshToken: string;
	user: User;
}
