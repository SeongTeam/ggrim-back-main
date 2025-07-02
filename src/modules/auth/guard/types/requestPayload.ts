import { User } from "../../../user/entity/user.entity";
import { JWTDecode } from "../../auth.service";
import { AUTH_GUARD_PAYLOAD } from "../const";

export type AuthGuardPayLoadUser = typeof AUTH_GUARD_PAYLOAD.USER;
export type AuthGuardPayloadSecurityToken = typeof AUTH_GUARD_PAYLOAD.SECURITY_TOKEN;
export type AuthGuardPayLoadAccessToken = typeof AUTH_GUARD_PAYLOAD.ACCESS_TOKEN;
export type AuthGuardPayLoadTempUser = typeof AUTH_GUARD_PAYLOAD.TEMP_USER;

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
