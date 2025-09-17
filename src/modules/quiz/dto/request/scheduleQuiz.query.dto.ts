import { Type } from "class-transformer";
import { IsNumber, ValidateNested } from "class-validator";
import { QuizContextDTO } from "./quizContext.dto";
import { IsOptionalProperty } from "../../../_common/decorator/swagger/class-validator/isOptionalProperty";

export class ScheduleQuizQueryDTO {
	/**
	 * @description all fields exist or not exist same time
	 * @example { currentIndex : 0 , endIndex : 0 , context[artist] : "example artist", context[page] : 0}
	 * @example { }
	 */
	@Type(() => Number)
	@IsOptionalProperty()
	@IsNumber()
	currentIndex?: number;

	@Type(() => Number)
	@IsOptionalProperty()
	@IsNumber()
	endIndex?: number;

	/**
	 * @description serialization format is deepObject
	 * @example /route?context[artist]="example artist"&context[page]=0
	 */
	@Type(() => QuizContextDTO)
	@IsOptionalProperty()
	@ValidateNested()
	context?: QuizContextDTO;
}
