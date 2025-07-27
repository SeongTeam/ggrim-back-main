import { QUIZ_TYPE } from "../const";
import { PickType } from "@nestjs/swagger";
import { Quiz } from "../entities/quiz.entity";

export type QuizType = (typeof QUIZ_TYPE)[keyof typeof QUIZ_TYPE];

export interface QuizContext {
	artist?: string;

	tag?: string;

	style?: string;

	page: number;
}

export interface QuizStatus {
	context: QuizContext;
	currentIndex: number;
	endIndex: number;
}

export class QuizSubmission extends PickType(Quiz, ["incorrect_count", "correct_count"]) {
	incorrect_count: number = 0;
	correct_count: number = 0;
}
