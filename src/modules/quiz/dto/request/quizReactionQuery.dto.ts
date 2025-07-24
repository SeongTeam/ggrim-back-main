import { PickType } from "@nestjs/mapped-types";
import { Transform } from "class-transformer";
import { IsNumber, IsOptional, IsUUID } from "class-validator";
import { QuizReactionDTO } from "./quizReaction.dto";

export class QuizReactionQueryDTO extends PickType(QuizReactionDTO, ["type"]) {
	@IsOptional()
	@IsUUID()
	user_id?: string;

	@IsOptional()
	@Transform(({ value }) => Number(value))
	@IsNumber()
	page?: number = 0;
}
