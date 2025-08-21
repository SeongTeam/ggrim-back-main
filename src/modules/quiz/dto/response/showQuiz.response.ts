import { Quiz } from "../../entities/quiz.entity";
import { ShowUserResponse } from "../../../user/dto/request/response/showUser.response";
import { ApiProperty } from "@nestjs/swagger";
import { ShowPainting } from "../../../painting/dto/response/showPainting.response";
import { QuizType } from "../../types/quiz";
import { ShowTag } from "../../../tag/dto/response/showTag.response";
import { ShowStyle } from "../../../style/dto/response/showStyle.response";
import { ShowArtist } from "../../../artist/dto/response/showArtist.response";
import { QUIZ_TYPE } from "../../const";

export class ShowQuiz {
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

export class ShowQuizResponse extends ShowQuiz {
	distractor_paintings: ShowPainting[];
	answer_paintings: ShowPainting[];
	example_painting?: ShowPainting;
	view_count: number;
	correct_count: number;
	incorrect_count: number;
	description: string;
	@ApiProperty({ enum: Object.values(QUIZ_TYPE), enumName: "QUIZ_TYPE" })
	type: QuizType;
	artists: ShowArtist[];
	tags: ShowTag[];
	styles: ShowStyle[];
	owner: ShowUserResponse;

	constructor(quiz: Quiz) {
		super(quiz);
		this.distractor_paintings = quiz.distractor_paintings.map((dp) => new ShowPainting(dp));
		this.answer_paintings = quiz.answer_paintings.map((ap) => new ShowPainting(ap));
		this.example_painting =
			quiz.example_painting !== undefined
				? new ShowPainting(quiz.example_painting)
				: undefined;
		this.view_count = quiz.view_count;
		this.correct_count = quiz.correct_count;
		this.incorrect_count = quiz.incorrect_count;
		this.description = quiz.description;
		this.type = quiz.type;
		this.artists = quiz.artists.map((a) => new ShowArtist(a));
		this.tags = quiz.tags.map((t) => new ShowTag(t));
		this.styles = quiz.styles.map((s) => new ShowStyle(s));
		this.owner = new ShowUserResponse(quiz.owner);
	}
}
