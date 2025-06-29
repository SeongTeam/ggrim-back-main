import { Quiz } from "../../entities/quiz.entity";

export interface WeeklyQuizSet {
	dataName: string;
	data: Quiz[];
}
