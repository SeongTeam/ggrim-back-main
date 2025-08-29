import * as z from "zod";
import { zShowUserResponse } from "../user/zodSchema";
import { ONE_TIME_TOKEN_PURPOSE } from "../../swagger/dto-types";

const bcryptPattern = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

export const zSignInResponse = z.object({
	accessToken: z.jwt(),
	refreshToken: z.jwt(),
	user: zShowUserResponse,
});

export const zShowOneTimeToken = z.object({
	id: z.uuid(),
	hashedToken: z.string().regex(bcryptPattern),
	used_date: z.iso.datetime().nullable(),
	expired_date: z.iso.datetime(),
	purpose: z.enum(Object.values(ONE_TIME_TOKEN_PURPOSE)),
});

export const zShowVerification = z.object({
	id: z.uuid(),
	verification_success_date: z.iso.datetime().nullable(),
	last_verified_date: z.iso.datetime().nullable(),
	hashedPinCode: z.string().regex(bcryptPattern),
	pin_code_expired_date: z.iso.datetime(),
});
