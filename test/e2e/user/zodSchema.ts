import * as z from "zod";
import { USER_ROLE, USER_STATE } from "../../generated/dto-types";

export const zShowUserResponse = z.object({
	id: z.number(),
	role: z.enum(Object.values(USER_ROLE)),
	username: z.string(),
	active: z.enum(Object.values(USER_STATE)),
	last_login_date: z.iso.datetime(),
	oauth_provider: z.string().nullish(),
	oauth_provider_id: z.string().nullish(),
});
