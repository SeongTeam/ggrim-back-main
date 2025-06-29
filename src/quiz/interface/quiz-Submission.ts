import { PickType } from "@nestjs/mapped-types";
import { Quiz } from "../entities/quiz.entity";

export class QuizSubmission extends PickType(Quiz, ["incorrect_count", "correct_count"]) {
	incorrect_count: number = 0;
	correct_count: number = 0;
}
