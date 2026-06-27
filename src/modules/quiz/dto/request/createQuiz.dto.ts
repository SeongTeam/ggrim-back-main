import { isArray, IsNumber, IsString, Min } from "class-validator";
import { IsInArray } from "../../../../utils/classValidator";
import { QUIZ_TYPE } from "../../const";
import { QuizType } from "../../type";
import { IsOptionalProperty } from "../../../_common/decorator/swagger/class-validator/isOptionalProperty";
import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { transformToId } from "../../../../utils/obfuscate";
import { isArrayEmpty } from "../../../../utils/validator";

export class CreateQuizDTO {
	@ApiProperty({ type: "string", isArray: true })
	@Transform(
		({ value }) => {
			if (!isArray(value)) {
				return null;
			}
			if (isArrayEmpty(value)) {
				return null;
			}
			return value.map((v) => transformToId(v));
		},
		{ toClassOnly: true },
	)
	@IsNumber(undefined, {
		each: true,
	})
	answerPaintingIds!: number[];

	@ApiProperty({ type: "string", isArray: true })
	@Transform(
		({ value }) => {
			if (!isArray(value)) {
				return null;
			}
			if (isArrayEmpty(value)) {
				return null;
			}
			return value.map((v) => transformToId(v));
		},
		{ toClassOnly: true },
	)
	@IsNumber(undefined, {
		each: true,
	})
	distractorPaintingIds!: number[];

	@ApiProperty({ type: "string" })
	@Transform(
		({ value }) => {
			if (value === undefined) {
				return undefined;
			}
			return transformToId(value);
		},
		{ toClassOnly: true },
	)
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
