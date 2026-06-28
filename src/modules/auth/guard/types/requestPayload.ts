import { User } from "../../../user/entity/user.entity";
import { JWTDecode } from "../../types/jwt";

export interface AuthUserPayload {
	user: User;
}

export interface OneTimeTokenPayload {
	oneTimeTokenID: number;
	oneTimeToken: string;
}

export type SecurityTokenPayload = OneTimeTokenPayload;

export interface AccessTokenPayload {
	userId: number;
	decodedToken: JWTDecode;
}

export interface TempUserPayload extends OneTimeTokenPayload {
	email: string;
}
