import { Quiz } from "../../entities/quiz.entity";
import { ShowUserResponse } from "../../../user/dto/request/response/showUser.response";
import { OmitType } from "@nestjs/swagger";
import { ShowPaintingResponse } from "../../../painting/dto/response/showPainting.response";
import { QuizType } from "../../types/quiz";
import { ShowTagResponse } from "../../../tag/dto/response/showTag.response";
import { ShowStyleResponse } from "../../../style/dto/response/showStyle.response";
import { ShowArtistResponse } from "../../../artist/dto/response/showArtist.response";

class ShowTag extends OmitType(ShowTagResponse, ["shortPaintings"] as const) {}
class ShowStyle extends OmitType(ShowStyleResponse, ["shortPaintings"] as const) {}
class ShowArtist extends OmitType(ShowArtistResponse, ["shortPaintings"] as const) {}
class ShowPainting extends OmitType(ShowPaintingResponse, [
	"showArtist",
	"showStyles",
	"showTags",
] as const) {}

export class ShowQuizResponse {
	showOwner!: ShowUserResponse;

	id: string;
	title: string;
	distractor_paintings: ShowPainting[];
	answer_paintings: ShowPainting[];
	example_painting?: ShowPainting;
	view_count: number;
	correct_count: number;
	incorrect_count: number;
	time_limit: number;
	description: string;
	type: QuizType;
	artists: ShowArtist[];
	tags: ShowTag[];
	styles: ShowStyle[];
	owner: ShowUserResponse;

	constructor(quiz: Quiz) {
		this.showOwner = new ShowUserResponse(quiz.owner);
		this.id = quiz.id;
		this.title = quiz.title;
		this.distractor_paintings = quiz.distractor_paintings.map(
			(dp) => new ShowPaintingResponse(dp),
		);
		this.answer_paintings = quiz.answer_paintings.map((ap) => new ShowPaintingResponse(ap));
		this.example_painting =
			quiz.example_painting !== undefined
				? new ShowPaintingResponse(quiz.example_painting)
				: undefined;
		this.view_count = quiz.view_count;
		this.correct_count = quiz.correct_count;
		this.incorrect_count = quiz.incorrect_count;
		this.time_limit = quiz.time_limit;
		this.description = quiz.description;
		this.type = quiz.type;
		this.artists = quiz.artists.map((a) => new ShowArtistResponse(a));
		this.tags = quiz.tags.map((t) => new ShowTagResponse(t));
		this.styles = quiz.styles.map((s) => new ShowStyleResponse(s));
		this.owner = new ShowUserResponse(quiz.owner);
	}

	// static createShowQuiz = (quiz: Quiz): ShowQuizResponse => {
	// 	const { owner, ...rest } = quiz;

	// 	const showQuiz = plainToInstance(ShowQuizResponse, rest);
	// 	const showOwner = new ShowUserResponse(owner);
	// 	showQuiz.showOwner = showOwner;
	// 	return showQuiz;
	// };
}
