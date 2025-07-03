import { User } from "../../../user/entity/user.entity";
import { JWTDecode } from "../../types/jwt";

export interface AuthUserPayload {
	user: User;
}

export interface OneTimeTokenPayload {
	oneTimeTokenID: string;
	oneTimeToken: string;
}

export type SecurityTokenPayload = OneTimeTokenPayload;

export interface AccessTokenPayload {
	userId: string;
	decodedToken: JWTDecode;
}

export interface TempUserPayload extends OneTimeTokenPayload {
	email: string;
}
