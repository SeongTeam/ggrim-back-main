import { Transform } from "class-transformer";
import { IsArray, IsUUID } from "class-validator";

export class GetByIdsQueryDTO {
	@Transform(({ value }) => (Array.isArray(value) ? value : [value]))
	@IsArray()
	@IsUUID("all", { each: true })
	ids!: string[];
}
