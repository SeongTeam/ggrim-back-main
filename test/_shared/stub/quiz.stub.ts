import { OmitType } from "@nestjs/swagger";
import { Quiz } from "../../../src/modules/quiz/entities/quiz.entity";
import { CustomBaseEntityStub } from "./customBaseEntity.stub";

export class QuizDummy extends OmitType(Quiz, [
	"artists",
	"styles",
	"tags",
	"owner",
	"owner_id",
	"answer_paintings",
	"distractor_paintings",
]) {}

export const getQuizStubs = (): QuizDummy => {
	return {
		id: "430f1aab-5a36-4dfe-aad5-d1bc3dffc7b3",
		title: "test quiz dummy",
		incorrect_count: 0,
		correct_count: 0,
		example_painting: null,
		time_limit: 30,
		type: "ONE_CHOICE",
		description: "",
		view_count: 0,
		...CustomBaseEntityStub(),
	};
};
