import { randomInt } from "node:crypto";
import { QuizContext } from "../../types/quiz";
import { ShortQuizResponse } from "./shortQuiz.response";

class ShowQuizContext implements QuizContext {
	artist?: string | undefined;
	tag?: string | undefined;
	style?: string | undefined;
	page: number;
	constructor(ctx: QuizContext) {
		this.artist = ctx.artist;
		this.tag = ctx.tag;
		this.style = ctx.style;
		this.page = ctx.page;
	}
}

export class ScheduleQuizResponse {
	shortQuiz!: ShortQuizResponse;
	context: ShowQuizContext;
	currentIndex: number;
	endIndex: number;

	constructor(shortQuizzes: ShortQuizResponse[], context: QuizContext, currentIndex?: number) {
		this.context = new ShowQuizContext(context);
		this.currentIndex = currentIndex
			? (currentIndex + 1) % shortQuizzes.length
			: randomInt(shortQuizzes.length);

		this.endIndex = shortQuizzes.length - 1;
		this.shortQuiz = shortQuizzes[this.currentIndex];
	}
}
