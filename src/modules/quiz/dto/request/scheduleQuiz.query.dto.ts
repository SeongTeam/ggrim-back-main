import { plainToClass, Transform, Type } from "class-transformer";
import { IsNumber, ValidateNested } from "class-validator";
import { QuizContextDTO } from "./quizContext.dto";
import { IsOptionalProperty } from "../../../_common/decorator/swagger/class-validator/isOptionalProperty";

export class ScheduleQuizQueryDTO {
	@Type(() => Number)
	@IsOptionalProperty()
	@IsNumber()
	currentIndex?: number;

	@Type(() => Number)
	@IsOptionalProperty()
	@IsNumber()
	endIndex?: number;

	//Quiz Context interface
	@Transform(({ value }: { value: string }) =>
		value ? plainToClass(QuizContextDTO, JSON.parse(value)) : null,
	)
	@IsOptionalProperty()
	@ValidateNested()
	context?: QuizContextDTO;
}
