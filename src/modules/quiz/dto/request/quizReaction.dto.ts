import { IsString } from "class-validator";
import { IsInArray } from "../../../../utils/classValidator";
import { ApiProperty } from "@dataui/crud/lib/crud";

export const QuizReactionTypeValues = {
	LIKE: "like",
	DISLIKE: "dislike",
} as const;

export type QuizReactionType = (typeof QuizReactionTypeValues)[keyof typeof QuizReactionTypeValues];
export class QuizReactionDTO {
	@ApiProperty({ enum: Object.values(QuizReactionTypeValues) })
	@IsString()
	@IsInArray(Object.values(QuizReactionTypeValues))
	type!: QuizReactionType;
}
