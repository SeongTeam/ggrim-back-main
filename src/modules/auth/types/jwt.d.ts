import { UserRole } from "../../user/entity/user.entity";
import { OneTimeTokenPurpose } from "../entity/oneTimeToken.entity";

export type TokenType = "REFRESH" | "ACCESS" | "ONE_TIME";
export type StandardTokenPurpose = "access" | "refresh";
export type JwtPurpose = OneTimeTokenPurpose | StandardTokenPurpose;

// ref : https://github.com/auth0/node-jsonwebtoken?tab=readme-ov-file#jwtsignpayload-secretorprivatekey-options-callback
export interface JWTDecode extends JWTPayload {
	iat: number; // second unit representing expired
	exp: number; // second unit representing expired
	// nbf?: Date;
	// aud? : object;
	// iss? : object;
}

export interface BaseJWTPayload {
	email: string;
	type: TokenType;
	purpose: JwtPurpose;
}
export interface JWTPayload extends BaseJWTPayload {
	username: string;
	role: UserRole;
}

export type AUTHORIZATION_TYPE = "Bearer" | "Basic";
