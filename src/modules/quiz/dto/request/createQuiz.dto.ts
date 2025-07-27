import { ArrayNotEmpty, IsArray, IsNumber, IsOptional, IsString, IsUUID } from "class-validator";
import { IsInArray } from "../../../../utils/classValidator";
import { QUIZ_TYPE } from "../../const";
import { ApiProperty } from "@dataui/crud/lib/crud";
import { QuizType } from "../../types/quiz";

export class CreateQuizDTO {
	/*TODO
    - answerPainting 과 distractor painting 크기 제한하기
    - 퀴즈 타입 사양에 맞추기
  */
	@IsArray()
	@ArrayNotEmpty()
	@IsUUID(undefined, {
		each: true,
	})
	answerPaintingIds!: string[];

	@IsArray()
	@ArrayNotEmpty()
	@IsUUID(undefined, {
		each: true,
	})
	distractorPaintingIds!: string[];

	@IsOptional()
	@IsArray()
	@ArrayNotEmpty()
	@IsUUID(undefined, {
		each: true,
	})
	examplePaintingId!: string;

	@IsString()
	title!: string;

	@IsNumber()
	timeLimit!: number;

	@ApiProperty({ enum: Object.values(QUIZ_TYPE) })
	@IsString()
	@IsInArray(Object.values(QUIZ_TYPE))
	type!: QuizType;

	@IsString()
	description!: string;
}
