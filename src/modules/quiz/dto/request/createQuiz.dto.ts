import { ArrayNotEmpty, IsArray, IsNumber, IsString, IsUUID } from "class-validator";
import { IsInArray } from "../../../../utils/classValidator";
import { QUIZ_TYPE } from "../../const";
import { QuizType } from "../../types/quiz";
import { IsOptionalProperty } from "../../../_common/decorator/swagger/class-validator/isOptionalProperty";
import { ApiProperty } from "@nestjs/swagger";

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

	@IsOptionalProperty()
	@IsUUID(undefined)
	examplePaintingId?: string;

	@IsString()
	title!: string;

	@IsNumber()
	timeLimit!: number;

	@ApiProperty({ enum: Object.values(QUIZ_TYPE), enumName: "QUIZ_TYPE" })
	@IsString()
	@IsInArray(Object.values(QUIZ_TYPE))
	type!: QuizType;

	@IsString()
	description!: string;
}
