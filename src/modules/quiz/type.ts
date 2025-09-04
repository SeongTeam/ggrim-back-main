import { Painting } from "../painting/entities/painting.entity";
import { QUIZ_TYPE } from "./const";
import { CreateQuizDTO } from "./dto/request/createQuiz.dto";

export type QuizType = (typeof QUIZ_TYPE)[keyof typeof QUIZ_TYPE];

export type RelatedPaintingIds = Pick<
	CreateQuizDTO,
	"answerPaintingIds" | "distractorPaintingIds" | "examplePaintingId"
>;
export interface RelatedPaintings {
	answerPaintings: Painting[];
	distractorPaintings: Painting[];
	examplePainting: Painting | undefined;
}
export interface QuizReactionCount {
	likeCount: number;
	dislikeCount: number;
}
