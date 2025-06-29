import { plainToClass, Transform, Type } from "class-transformer";
import { IsNumber, IsOptional, ValidateNested } from "class-validator";
import { QuizContextDTO } from "./quiz-context.dto";

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
	@Transform(({ value }) => {
		const plain = JSON.parse(value);
		return value ? plainToClass(QuizContextDTO, plain) : null;
	})
	@IsOptional()
	@ValidateNested()
	context?: QuizContextDTO;
}
