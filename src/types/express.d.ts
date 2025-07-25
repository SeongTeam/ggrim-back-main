type RequestPayloadMap = {
	//Mapping property to type by AUTH_GUARD_PAYLOAD
	AuthUserPayload: import("../modules/auth/guard/types/requestPayload").AuthUserPayload;
	AccessTokenPayload: import("../modules/auth/guard/types/requestPayload").AccessTokenPayload;
	SecurityTokenPayload: import("../modules/auth/guard/types/requestPayload").SecurityTokenPayload;
	TempUser: import("../modules/auth/guard/types/requestPayload").TempUserPayload;
};

declare namespace Express {
	interface Request extends Partial<RequestPayloadMap> {
		isRateLimitChecked?: boolean;
	}
}
