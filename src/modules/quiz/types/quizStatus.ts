import { QuizContext } from "./quizContext";

export interface QuizStatus {
	context: QuizContext;
	currentIndex: number;
	endIndex: number;
}
