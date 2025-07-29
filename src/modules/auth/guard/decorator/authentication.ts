import { applyDecorators, UseGuards } from "@nestjs/common";
import { BasicGuard } from "../authentication/basic.guard";
import { ApiHeader, ApiUnauthorizedResponse } from "@nestjs/swagger";
import { TokenAuthGuard } from "../authentication/tokenAuth.guard";
import { SecurityTokenGuard } from "../authentication/securityToken.guard";
import { ONE_TIME_TOKEN_HEADER } from "../const";
import { OneTimeTokenPurpose } from "../../types/oneTimeToken";
import { SecurityTokenGuardOptions } from "../../metadata/securityTokenGuardOption";
import { PurposeOneTimeToken } from "../../metadata/purposeOneTimeToken";

export function UseBasicAuthGuard() {
	return applyDecorators(
		UseGuards(BasicGuard),
		ApiHeader({
			name: "authorization",
			description: "account authorization header. ",
			example: "Basic BASE64_ENCODED(id:pw)",
			required: true,
		}),
		ApiUnauthorizedResponse({ description: "Not Authorized Account" }),
	);
}

export function UseTokenAuthGuard() {
	return applyDecorators(
		UseGuards(TokenAuthGuard),
		ApiHeader({
			name: "authorization",
			description: "bear authorization header",
			example: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6...",
			required: true,
		}),
		ApiUnauthorizedResponse({ description: "Not Authorized Token" }),
	);
}

export function UseSecurityTokenGuard(
	purpose: OneTimeTokenPurpose,
	options?: SecurityTokenGuardOptions,
) {
	return applyDecorators(
		PurposeOneTimeToken(purpose),
		SecurityTokenGuardOptions(options ?? { withDeleted: false }),
		UseGuards(SecurityTokenGuard),
		//TODO ApiHeader 중복사용확인하기
		ApiHeader({
			name: ONE_TIME_TOKEN_HEADER.X_ONE_TIME_TOKEN,
			description: "oneTimeToken issued for security purpose",
		}),
		ApiHeader({
			name: ONE_TIME_TOKEN_HEADER.X_ONE_TIME_TOKEN_ID,
			description: "oneTimeToken identifier",
		}),
		ApiUnauthorizedResponse({ description: "Not Authorized oneTimeToken" }),
	);
}
