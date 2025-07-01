import { CreateQuizDTO } from "../dto/request/createQuizDTO";

export interface RelatedPaintingIds
	extends Pick<
		CreateQuizDTO,
		"answerPaintingIds" | "distractorPaintingIds" | "examplePaintingId"
	> {}
