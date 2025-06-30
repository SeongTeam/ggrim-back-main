import { Painting } from "../../painting/entities/painting.entity";
import { CreateQuizDTO } from "../dto/request/createQuiz.dto";

export interface RelatedPaintingIds
	extends Pick<
		CreateQuizDTO,
		"answerPaintingIds" | "distractorPaintingIds" | "examplePaintingId"
	> {}
export interface RelatedPaintings {
	answerPaintings: Painting[];
	distractorPaintings: Painting[];
	examplePainting: Painting | undefined;
}
