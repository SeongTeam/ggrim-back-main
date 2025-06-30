import { ArrayNotEmpty, IsArray, IsNumber, IsOptional, IsString, IsUUID } from "class-validator";
import { IsInArray } from "../../../utils/classValidator";
import { TYPE_VALUES } from "../../const";
import { QUIZ_TYPE } from "../../type";

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

	@IsString()
	@IsInArray(TYPE_VALUES)
	type!: QUIZ_TYPE;

	@IsString()
	description!: string;
}
