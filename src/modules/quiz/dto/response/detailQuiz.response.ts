import { Quiz } from "../../entities/quiz.entity";
import { QuizReactionCount } from "../../type";
import { QUIZ_REACTION, QuizReactionType } from "../../const";
import { ShowQuizResponse } from "./showQuiz.response";
import { ApiProperty } from "@nestjs/swagger";

class ShowQuizReactionCount implements QuizReactionCount {
	likeCount!: number;
	dislikeCount!: number;
}

export class DetailQuizResponse {
	quiz!: ShowQuizResponse;
	reactionCount!: ShowQuizReactionCount;
	@ApiProperty({ enum: Object.values(QUIZ_REACTION), enumName: "QUIZ_REACTION" })
	userReaction?: QuizReactionType;

	constructor(quiz: Quiz, reactionCount: QuizReactionCount, userReaction?: QuizReactionType) {
		this.quiz = new ShowQuizResponse(quiz);
		this.reactionCount = reactionCount;
		this.userReaction = userReaction;
	}
}
