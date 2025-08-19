import { ShowUserResponse } from "../../../user/dto/request/response/showUser.response";
import { QuizDislike } from "../../entities/quizDislike.entity";
import { QuizLike } from "../../entities/quizLike.entity";
import { QuizReactionType } from "../../const";

export class ShowQuizReactionResponse {
	type: QuizReactionType;
	user: ShowUserResponse;

	constructor(reaction: QuizLike | QuizDislike) {
		this.type = reaction._type;
		this.user = new ShowUserResponse(reaction.user);
	}
}
