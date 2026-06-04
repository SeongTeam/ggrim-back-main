import { ArrayNotEmpty, IsArray, IsNumber, IsString, Min } from "class-validator";
import { IsInArray } from "../../../../utils/classValidator";
import { QUIZ_TYPE } from "../../const";
import { QuizType } from "../../type";
import { IsOptionalProperty } from "../../../_common/decorator/swagger/class-validator/isOptionalProperty";
import { ApiProperty } from "@nestjs/swagger";

export class CreateQuizDTO {
	/*TODO
    - answerPainting 과 distractor painting 크기 제한하기
    - 퀴즈 타입 사양에 맞추기
  */
	@IsArray()
	@ArrayNotEmpty()
	@IsNumber(undefined, {
		each: true,
	})
	answerPaintingIds!: number[];

	@IsArray()
	@ArrayNotEmpty()
	@IsNumber(undefined, {
		each: true,
	})
	distractorPaintingIds!: number[];

	@IsOptionalProperty()
	@IsNumber(undefined)
	examplePaintingId?: number;

	@IsString()
	title!: string;

	@IsNumber()
	@Min(0)
	timeLimit!: number;

	@ApiProperty({ enum: [QUIZ_TYPE.ONE_CHOICE], enumName: "QUIZ_TYPE" })
	@IsString()
	@IsInArray([QUIZ_TYPE.ONE_CHOICE])
	type!: QuizType;

	@IsString()
	description!: string;
}
