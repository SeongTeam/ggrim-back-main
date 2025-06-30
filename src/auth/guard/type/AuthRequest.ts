import {
	AccessTokenPayload,
	AuthUserPayload,
	ENUM_AUTH_CONTEXT_KEY,
	SecurityTokenPayload,
	TempUserPayload,
} from "./requestPayload";
import { Request } from "express";

export interface AuthenticatedRequest extends Request {
	[ENUM_AUTH_CONTEXT_KEY.USER]?: AuthUserPayload; // 또는 any
	[ENUM_AUTH_CONTEXT_KEY.SECURITY_TOKEN]?: SecurityTokenPayload; // 또는 any
	[ENUM_AUTH_CONTEXT_KEY.ACCESS_TOKEN]?: AccessTokenPayload; // 또는 any
	[ENUM_AUTH_CONTEXT_KEY.TEMP_USER]?: TempUserPayload; // 또는 any
}
