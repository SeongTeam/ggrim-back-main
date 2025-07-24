import { OmitType } from "@nestjs/mapped-types";
import { CreateQuizDTO } from "./createQuiz.dto";

export class UpdateQuizDTO extends OmitType(CreateQuizDTO, ["type"]) {}
