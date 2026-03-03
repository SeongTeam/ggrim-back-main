import z from "zod";
import { QUIZ_REACTION, QUIZ_TYPE } from "../../openapi/dto-types";
import { zShowUserResponse } from "../user/zodSchema";
import { zShowPainting } from "../painting/zodSchema";
import { zShowArtist } from "../artist/zodSchema";
import { zShowTag } from "../tag/zodSchema";
import { zShowStyle } from "../style/zodSchema";

export const zShowQuiz = z.object({
	id: z.string(),
	title: z.string(),
	time_limit: z.number(),
	created_date: z.string(),
	updated_date: z.string(),
	showOwner: zShowUserResponse,
});

export const zShowQuizResponse = zShowQuiz.extend({
	distractor_paintings: zShowPainting.array(),
	answer_paintings: zShowPainting.array(),
	example_painting: zShowPainting.optional(),
	view_count: z.number(),
	correct_count: z.number(),
	incorrect_count: z.number(),
	description: z.string(),
	type: z.enum(Object.values(QUIZ_TYPE)),
	artists: zShowArtist.array(),
	tags: zShowTag.array(),
	styles: zShowStyle.array(),
	owner: zShowUserResponse,
});

export const zShowQuizReactionCount = z.object({
	likeCount: z.number(),
	dislikeCount: z.number(),
});

export const zShowQuizContext = z.object({
	artist: z.string().optional(),
	tag: z.string().optional(),
	style: z.string().optional(),
	page: z.number(),
});

export const zScheduleQuizResponse = z.object({
	shortQuiz: zShowQuiz,
	context: zShowQuizContext,
	currentIndex: z.number(),
	endIndex: z.number(),
});

export const zShowQuizReactionResponse = z.object({
	type: z.enum(Object.values(QUIZ_REACTION)),
	user: zShowUserResponse,
});

export const zDetailQuizResponse = z.object({
	quiz: zShowQuizResponse,
	reactionCount: zShowQuizReactionCount,
	userReaction: z.enum(Object.values(QUIZ_REACTION)).optional(),
});
