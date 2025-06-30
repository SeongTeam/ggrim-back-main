import { Quiz } from "../../entities/quiz.entity";
import { QuizReactionCount } from "../../interface/reactionCount";
import { QuizReactionType } from "../request/quizReactionDTO";
import { ShowQuizResponse } from "./showQuizResponse.dto";

export class DetailQuizResponse {
	quiz!: ShowQuizResponse;
	reactionCount!: QuizReactionCount;
	userReaction?: QuizReactionType;

	constructor(quiz: Quiz, reactionCount: QuizReactionCount, userReaction?: QuizReactionType) {
		this.quiz = ShowQuizResponse.createShowQuiz(quiz);
		this.reactionCount = reactionCount;
		this.userReaction = userReaction;
	}
}
