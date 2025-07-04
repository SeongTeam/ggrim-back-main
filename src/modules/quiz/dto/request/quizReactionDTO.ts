import { IsString } from "class-validator";
import { IsInArray } from "../../../../utils/classValidator";

export const QuizReactionTypeValues = {
	LIKE: "like",
	DISLIKE: "dislike",
} as const;

export type QuizReactionType = (typeof QuizReactionTypeValues)[keyof typeof QuizReactionTypeValues];
export class QuizReactionDTO {
	@IsString()
	@IsInArray(Object.values(QuizReactionTypeValues))
	type!: QuizReactionType;
}
