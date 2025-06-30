import { PartialType } from "@nestjs/mapped-types";
import { CreatePaintingDTO } from "./createPainting.dto";

export class UpdatePaintingDto extends PartialType(CreatePaintingDTO) {}
