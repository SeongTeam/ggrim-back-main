import { OmitType } from "@nestjs/mapped-types";
import { plainToInstance } from "class-transformer";
import { ShortUser } from "../../../user/types/shortUser";
import { Quiz } from "../../entities/quiz.entity";

export class ShowQuizResponse extends OmitType(Quiz, ["owner"] as const) {
	shortOwner!: ShortUser;

	static createShowQuiz = (quiz: Quiz): ShowQuizResponse => {
		const { owner, ...rest } = quiz;

		const showQuiz = plainToInstance(ShowQuizResponse, rest);
		const shortOwner = new ShortUser(owner);
		showQuiz.shortOwner = shortOwner;
		return showQuiz;
	};
}
