import { CreateQuizDTO } from "../dto/request/createQuiz.dto";

export type RelatedPaintingIds = Pick<
	CreateQuizDTO,
	"answerPaintingIds" | "distractorPaintingIds" | "examplePaintingId"
>;
