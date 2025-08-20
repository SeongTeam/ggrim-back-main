import { Expose, Transform, Type } from "class-transformer";
import { ArrayNotEmpty, IsNumber, IsString } from "class-validator";
import { QuizContext } from "../../types/quiz";
import { IsOptionalProperty } from "../../../_common/decorator/swagger/class-validator/isOptionalProperty";
import { ApiHideProperty } from "@nestjs/swagger";

export class QuizContextDTO implements QuizContext {
	@IsOptionalProperty()
	@IsString()
	artist?: string;

	@IsOptionalProperty()
	@IsString()
	tag?: string;

	@IsOptionalProperty()
	@IsString()
	style?: string;

	@Type(() => Number)
	@IsNumber()
	page!: number;

	@ApiHideProperty()
	@Expose()
	@Transform(({ obj }: { obj: QuizContextDTO }) =>
		[obj.artist, obj.tag, obj.style].filter((v) => v),
	)
	@ArrayNotEmpty({ message: "At least one of artist, tag, or style must be provided!" })
	_atLeastOne!: object; // 내부 필드 검증용 더미 객체
}
