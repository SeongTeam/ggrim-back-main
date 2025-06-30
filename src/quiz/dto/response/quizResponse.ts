import { randomInt } from "node:crypto";
import { QuizContext } from "../../interface/quizContext";
import { QuizStatus } from "../../interface/quizStatus";
import { ShortQuiz } from "../../interface/shortQuiz";

export class QuizResponse {
	shortQuiz!: ShortQuiz;
	status!: QuizStatus;

	constructor(shortQuizzes: ShortQuiz[], context: QuizContext, currentIndex?: number) {
		const INIT_INDEX = -1;
		this.status = { currentIndex: INIT_INDEX, endIndex: INIT_INDEX, context };
		this.status.currentIndex = currentIndex
			? (currentIndex + 1) % shortQuizzes.length
			: randomInt(shortQuizzes.length);

		this.status.endIndex = shortQuizzes.length - 1;
		this.shortQuiz = shortQuizzes[this.status.currentIndex];
	}
}
