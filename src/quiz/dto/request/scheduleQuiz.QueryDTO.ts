import { plainToClass, Transform, Type } from "class-transformer";
import { IsNumber, IsOptional, ValidateNested } from "class-validator";
import { QuizContextDTO } from "./quizContextDTO";

export class ScheduleQuizQueryDTO {
	@Type(() => Number)
	@IsOptional()
	@IsNumber()
	currentIndex?: number;

	@Type(() => Number)
	@IsOptional()
	@IsNumber()
	endIndex?: number;

	//Quiz Context interface
	@Transform(({ value }: { value: string }) =>
		value ? plainToClass(QuizContextDTO, JSON.parse(value)) : null,
	)
	@IsOptional()
	@ValidateNested()
	context?: QuizContextDTO;
}
