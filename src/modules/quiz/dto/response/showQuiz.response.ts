import { plainToInstance } from "class-transformer";
import { Quiz } from "../../entities/quiz.entity";
import { ShowUserResponse } from "../../../user/dto/request/response/showUser.response";
import { OmitType } from "@nestjs/swagger";

export class ShowQuizResponse extends OmitType(Quiz, ["owner"] as const) {
	showOwner!: ShowUserResponse;

	static createShowQuiz = (quiz: Quiz): ShowQuizResponse => {
		const { owner, ...rest } = quiz;

		const showQuiz = plainToInstance(ShowQuizResponse, rest);
		const showOwner = new ShowUserResponse(owner);
		showQuiz.showOwner = showOwner;
		return showQuiz;
	};
}
