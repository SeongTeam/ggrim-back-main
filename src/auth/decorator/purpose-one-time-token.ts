// decorators/check-ownership.decorator.ts
import { SetMetadata } from "@nestjs/common";
import { OneTimeTokenPurpose } from "../entity/one-time-token.entity";

export const PURPOSE_ONE_TIME_TOKEN_KEY = "purpose_one_time_token_key";

export const PurposeOneTimeToken = (purpose: OneTimeTokenPurpose) =>
	SetMetadata(PURPOSE_ONE_TIME_TOKEN_KEY, purpose);
