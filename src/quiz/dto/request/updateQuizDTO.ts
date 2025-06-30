import { OmitType } from "@nestjs/mapped-types";
import { CreateQuizDTO } from "./createQuizDTO";

export class UpdateQuizDTO extends OmitType(CreateQuizDTO, ["type"]) {}
