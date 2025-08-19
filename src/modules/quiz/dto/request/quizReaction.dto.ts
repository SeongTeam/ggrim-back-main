import { IsString } from "class-validator";
import { IsInArray } from "../../../../utils/classValidator";
import { ApiProperty } from "@dataui/crud/lib/crud";
import { QUIZ_REACTION, QuizReactionType } from "../../const";

export class QuizReactionDTO {
	//TODO Enum field 이름 수정하기
	// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
	@ApiProperty({ enum: Object.values(QUIZ_REACTION) })
	@IsString()
	@IsInArray(Object.values(QUIZ_REACTION))
	type!: QuizReactionType;
}
