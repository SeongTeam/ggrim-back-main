import { Quiz } from "../../entities/quiz.entity";
import { QuizReactionCount } from "../../types/reaction";
import { QuizReactionType } from "../../const";
import { ShowQuizResponse } from "./showQuiz.response";

export class DetailQuizResponse {
	quiz!: ShowQuizResponse;
	reactionCount!: QuizReactionCount;
	userReaction?: QuizReactionType;

	constructor(quiz: Quiz, reactionCount: QuizReactionCount, userReaction?: QuizReactionType) {
		this.quiz = new ShowQuizResponse(quiz);
		this.reactionCount = reactionCount;
		this.userReaction = userReaction;
	}
}
