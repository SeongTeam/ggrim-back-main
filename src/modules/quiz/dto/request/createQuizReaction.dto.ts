import { IsString } from "class-validator";
import { IsInArray } from "../../../../utils/classValidator";
import { QUIZ_REACTION, QuizReactionType } from "../../const";
import { ApiProperty } from "@nestjs/swagger";

export class CreateQuizReactionDTO {
	@ApiProperty({ enum: Object.values(QUIZ_REACTION), enumName: "QUIZ_REACTION" })
	@IsString()
	@IsInArray(Object.values(QUIZ_REACTION))
	type!: QuizReactionType;
}
