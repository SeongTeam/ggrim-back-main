import { Transform } from "class-transformer";
import { IsArray, IsUUID } from "class-validator";

export class GetByIdsQueryDTO {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-return
	@Transform(({ value }) => (Array.isArray(value) ? value : [value]))
	@IsArray()
	@IsUUID("all", { each: true })
	ids!: string[];
}
