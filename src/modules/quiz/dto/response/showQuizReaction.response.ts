import { ShowUserResponse } from "../../../user/dto/request/response/showUser.response";
import { QuizDislike } from "../../entities/quizDislike.entity";
import { QuizLike } from "../../entities/quizLike.entity";
import { QUIZ_REACTION, QuizReactionType } from "../../const";
import { ApiProperty } from "@nestjs/swagger";

export class ShowQuizReactionResponse {
	@ApiProperty({ enum: Object.values(QUIZ_REACTION), enumName: "QUIZ_REACTION" })
	type: QuizReactionType;
	user: ShowUserResponse;

	constructor(reaction: QuizLike | QuizDislike) {
		this.type = reaction._type;
		this.user = new ShowUserResponse(reaction.user);
	}
}
