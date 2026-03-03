import { OmitType } from "@nestjs/swagger";
import { CreateQuizDTO } from "./createQuiz.dto";

export class ReplaceQuizDTO extends OmitType(CreateQuizDTO, ["type"]) {}
