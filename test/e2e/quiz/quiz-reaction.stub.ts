import { OmitType } from "@nestjs/swagger";
import { QuizDislike } from "../../../src/modules/quiz/entities/quizDislike.entity";
import { CustomBaseEntityStub } from "../../_shared/stub/customBaseEntity.stub";
import { QuizLike } from "../../../src/modules/quiz/entities/quizLike.entity";

class QuizDislikeDummy extends OmitType(QuizDislike, ["quiz", "quiz_id", "user", "user_id"]) {}
class QuizLikeDummy extends OmitType(QuizLike, ["quiz", "quiz_id", "user", "user_id"]) {}

export const getQuizDislike = (): QuizDislikeDummy => {
	return {
		_type: "dislike",
		id: "kcd11a06-5a66-4dfe-aad5-d1bc3dffc7b3",
		...CustomBaseEntityStub(),
	};
};

export const getQuizLike = (): QuizLikeDummy => {
	return {
		_type: "like",
		id: "k3d1gam6-5a66-4dfe-aad5-d1bc3dffc7b3",
		...CustomBaseEntityStub(),
	};
};
