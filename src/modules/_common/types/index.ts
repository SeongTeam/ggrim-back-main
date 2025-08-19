import { ApiProperty } from "@nestjs/swagger";

export class Pagination<T> {
	@ApiProperty()
	data!: T[];

	@ApiProperty()
	count!: number;

	@ApiProperty()
	total!: number;

	@ApiProperty()
	page!: number;

	@ApiProperty()
	pageCount!: number;
}

export interface UpdateInfo {
	targetId: string;
	isSuccess: boolean;
}
