export const AUTH_GUARD_PAYLOAD = {
	USER: "AuthUserPayload",
	SECURITY_TOKEN: "SecurityTokenPayload",
	ACCESS_TOKEN: "AccessTokenPayload",
	TEMP_USER: "TempUser",
} as const;

export const ONE_TIME_TOKEN_HEADER = {
	X_ONE_TIME_TOKEN_ID: `x-one-time-token-identifier`,
	X_ONE_TIME_TOKEN: "x-one-time-token-value",
} as const;
