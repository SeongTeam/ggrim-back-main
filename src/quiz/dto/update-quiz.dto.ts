import { OmitType } from "@nestjs/mapped-types";
import { CreateQuizDTO } from "./create-quiz.dto";

export class UpdateQuizDTO extends OmitType(CreateQuizDTO, ["type"]) {}
