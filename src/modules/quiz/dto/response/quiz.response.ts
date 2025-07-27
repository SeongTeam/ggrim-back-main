import { randomInt } from "node:crypto";
import { QuizContext, QuizStatus } from "../../types/quiz";
import { ShortQuizResponse } from "./shortQuiz.response";

export class QuizResponse {
	shortQuiz!: ShortQuizResponse;
	status!: QuizStatus;

	constructor(shortQuizzes: ShortQuizResponse[], context: QuizContext, currentIndex?: number) {
		const INIT_INDEX = -1;
		this.status = { currentIndex: INIT_INDEX, endIndex: INIT_INDEX, context };
		this.status.currentIndex = currentIndex
			? (currentIndex + 1) % shortQuizzes.length
			: randomInt(shortQuizzes.length);

		this.status.endIndex = shortQuizzes.length - 1;
		this.shortQuiz = shortQuizzes[this.status.currentIndex];
	}
}
