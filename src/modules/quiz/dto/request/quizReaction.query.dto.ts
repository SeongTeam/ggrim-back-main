import { PickType } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsNumber, IsUUID } from "class-validator";
import { QuizReactionDTO } from "./quizReaction.dto";
import { IsOptionalProperty } from "../../../_common/decorator/swagger/class-validator/isOptionalProperty";

export class QuizReactionQueryDTO extends PickType(QuizReactionDTO, ["type"]) {
	@IsOptionalProperty()
	@IsUUID()
	user_id?: string;

	@Transform(({ value }) => Number(value))
	@IsOptionalProperty()
	@IsNumber()
	page?: number = 0;
}
