import { OmitType } from "@nestjs/swagger";
import { QuizDislike } from "../../../src/modules/quiz/entities/quizDislike.entity";
import { CustomBaseEntityStub } from "../../_shared/stub/customBaseEntity.stub";
import { QuizLike } from "../../../src/modules/quiz/entities/quizLike.entity";
import { faker } from "@faker-js/faker";
import { QuizReactionType } from "../../../src/modules/quiz/const";

export class QuizDislikeDummy extends OmitType(QuizDislike, [
	"quiz",
	"quiz_id",
	"user",
	"user_id",
]) {}
export class QuizLikeDummy extends OmitType(QuizLike, ["quiz", "quiz_id", "user", "user_id"]) {}

type QuizReactionDummy<Type extends QuizReactionType> = Type extends "dislike"
	? QuizDislikeDummy
	: QuizLikeDummy;

// 오버로드 시그니처
export function factoryQuizReaction(type: "dislike"): QuizDislikeDummy;
export function factoryQuizReaction(type: "like"): QuizLikeDummy;

// 구현 시그니처 (함수 본문)
export function factoryQuizReaction(type: QuizReactionType): QuizReactionDummy<typeof type> {
	return {
		_type: type,
		id: faker.string.uuid(),
		...CustomBaseEntityStub(),
	};
}
