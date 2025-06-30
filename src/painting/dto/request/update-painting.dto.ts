import { PartialType } from "@nestjs/mapped-types";
import { CreatePaintingDTO } from "./create-painting.dto";

export class UpdatePaintingDto extends PartialType(CreatePaintingDTO) {}
