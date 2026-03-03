import { IsBoolean, IsNotEmpty } from "class-validator";

export class SubmitQuizDTO {
	@IsBoolean()
	@IsNotEmpty()
	isCorrect!: boolean;
}
