import { Quiz } from "../../entities/quiz.entity";
import { ShowUserResponse } from "../../../user/dto/request/response/showUser.response";

export class ShortQuizResponse {
	readonly id: string;
	readonly title: string;

	readonly time_limit: number;
	readonly created_date: Date;
	readonly updated_date: Date;
	readonly showOwner: ShowUserResponse;

	constructor(quiz: Quiz) {
		this.id = quiz.id;
		this.title = quiz.title;
		this.time_limit = quiz.time_limit;
		this.created_date = quiz.created_date;
		this.updated_date = quiz.created_date;
		this.showOwner = new ShowUserResponse(quiz.owner);
	}
}
