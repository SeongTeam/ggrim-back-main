import { OmitType } from "@nestjs/swagger";
import { Quiz } from "../../../src/modules/quiz/entities/quiz.entity";
import { CustomBaseEntityStub, factoryCustomBaseStub } from "./customBaseEntity.stub";
import { faker } from "@faker-js/faker";
import { QUIZ_TYPE } from "../../../src/modules/quiz/const";

export class QuizDummy extends OmitType(Quiz, [
	"artists",
	"styles",
	"tags",
	"owner",
	"owner_id",
	"answer_paintings",
	"distractor_paintings",
]) {}

export const factoryQuizStub = (): QuizDummy => {
	const title = faker.lorem.sentence();
	const view_count = faker.number.int({ min: 1, max: 10000000 });
	const passRatio = faker.number.float({ min: 0.2, max: 0.5 });
	const correctRatio = faker.number.float({ min: 0.2, max: 0.5 });
	const passCount = Math.floor(view_count * passRatio);
	const correct_count = Math.floor((view_count - passCount) * correctRatio);
	const incorrect_count = Math.max(0, view_count - passCount - correct_count);
	return {
		title,
		id: faker.string.uuid(),
		description: faker.commerce.productDescription(),
		...factoryCustomBaseStub(),
		example_painting: null,
		view_count,
		correct_count,
		incorrect_count,
		time_limit: 30,
		type: QUIZ_TYPE.ONE_CHOICE,
	};
};

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
