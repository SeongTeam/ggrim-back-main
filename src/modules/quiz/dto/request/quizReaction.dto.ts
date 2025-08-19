import { IsString } from "class-validator";
import { IsInArray } from "../../../../utils/classValidator";
import { ApiProperty } from "@dataui/crud/lib/crud";

export const QUIZ_REACTION = {
	LIKE: "like",
	DISLIKE: "dislike",
} as const;

export type QuizReactionType = (typeof QUIZ_REACTION)[keyof typeof QUIZ_REACTION];
export class QuizReactionDTO {
	//TODO Enum field 이름 수정하기
	@ApiProperty({ enum: Object.values(QUIZ_REACTION) })
	@IsString()
	@IsInArray(Object.values(QUIZ_REACTION))
	type!: QuizReactionType;
}
