import { ONE_TIME_TOKEN_PURPOSE } from "../const";

export type OneTimeTokenPurpose =
	(typeof ONE_TIME_TOKEN_PURPOSE)[keyof typeof ONE_TIME_TOKEN_PURPOSE];
