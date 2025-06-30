import { PartialType } from "@nestjs/mapped-types";
import { CreatePaintingDTO } from "./createPaintingDTO";

export class UpdatePaintingDto extends PartialType(CreatePaintingDTO) {}
