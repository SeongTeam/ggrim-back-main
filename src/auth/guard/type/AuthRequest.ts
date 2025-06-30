import {
	AccessTokenPayload,
	AuthUserPayload,
	AUTH_GUARD_PAYLOAD,
	SecurityTokenPayload,
	TempUserPayload,
} from "./requestPayload";
import { Request } from "express";

export interface AuthGuardRequest extends Request {
	[AUTH_GUARD_PAYLOAD.USER]?: AuthUserPayload; // 또는 any
	[AUTH_GUARD_PAYLOAD.SECURITY_TOKEN]?: SecurityTokenPayload; // 또는 any
	[AUTH_GUARD_PAYLOAD.ACCESS_TOKEN]?: AccessTokenPayload; // 또는 any
	[AUTH_GUARD_PAYLOAD.TEMP_USER]?: TempUserPayload; // 또는 any
}
