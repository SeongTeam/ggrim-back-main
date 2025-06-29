import { IsArray, IsUUID } from "class-validator";

export class FindPaintingQueryDTO {
	@IsArray()
	@IsUUID(undefined, {
		each: true,
	})
	ids!: string[];
}
