import { OmitType } from "@nestjs/mapped-types";
import { plainToInstance } from "class-transformer";
import { ShortUser } from "../../../user/interface/shortUser";
import { Quiz } from "../../entities/quiz.entity";
import { QuizReactionCount } from "../../interface/reaction-count";
import { QuizReactionType } from "../request/quiz-reaction.dto";

export class DetailQuizDTO {
	quiz!: ShowQuiz;
	reactionCount!: QuizReactionCount;
	userReaction?: QuizReactionType;

	constructor(quiz: Quiz, reactionCount: QuizReactionCount, userReaction?: QuizReactionType) {
		this.quiz = ShowQuiz.createShowQuiz(quiz);
		this.reactionCount = reactionCount;
		this.userReaction = userReaction;
	}
}

export class ShowQuiz extends OmitType(Quiz, ["owner"] as const) {
	shortOwner!: ShortUser;

	static createShowQuiz = (quiz: Quiz): ShowQuiz => {
		const { owner, ...rest } = quiz;

		const showQuiz = plainToInstance(ShowQuiz, rest);
		const shortOwner = new ShortUser(owner);
		showQuiz.shortOwner = shortOwner;
		return showQuiz;
	};
}
