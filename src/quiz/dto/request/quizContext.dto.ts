import { Expose, Transform, Type } from "class-transformer";
import { ArrayNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { QuizContext } from "../../interface/quizContext";

export class QuizContextDTO implements QuizContext {
	@IsOptional()
	@IsString()
	artist?: string;

	@IsOptional()
	@IsString()
	tag?: string;

	@IsOptional()
	@IsString()
	style?: string;

	@Type(() => Number)
	@IsNumber()
	page!: number;

	@Expose()
	@Transform(({ obj }) => [obj.artist, obj.tag, obj.style].filter((v) => v))
	@ArrayNotEmpty({ message: "At least one of artist, tag, or style must be provided!" })
	_atLeastOne!: object; // 내부 필드 검증용 더미 객체
}
