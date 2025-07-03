// decorators/check-ownership.decorator.ts
import { SetMetadata } from "@nestjs/common";

export interface SecurityTokenGuardOptions {
	withDeleted?: boolean;
}

export const SECURITY_TOKEN_GUARD_OPTIONS = "security_token_guard_options";

export const SecurityTokenGuardOptions = (options: SecurityTokenGuardOptions) =>
	SetMetadata(SECURITY_TOKEN_GUARD_OPTIONS, options);
