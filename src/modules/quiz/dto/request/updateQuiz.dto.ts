import { OmitType } from "@nestjs/swagger";
import { CreateQuizDTO } from "./createQuiz.dto";

export class UpdateQuizDTO extends OmitType(CreateQuizDTO, ["type"]) {}
