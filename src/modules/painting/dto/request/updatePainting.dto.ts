import { PartialType } from "@nestjs/swagger";
import { CreatePaintingDTO } from "./createPainting.dto";

export class UpdatePaintingDto extends PartialType(CreatePaintingDTO) {}
