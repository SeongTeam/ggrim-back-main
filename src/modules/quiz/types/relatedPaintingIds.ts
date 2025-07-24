import { CreateQuizDTO } from "../dto/request/createQuiz.dto";

export interface RelatedPaintingIds
	extends Pick<
		CreateQuizDTO,
		"answerPaintingIds" | "distractorPaintingIds" | "examplePaintingId"
	> {}
