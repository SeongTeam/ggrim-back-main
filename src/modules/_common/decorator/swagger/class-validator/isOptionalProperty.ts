import { applyDecorators } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, ValidationOptions } from "class-validator";

export function IsOptionalProperty(validationOptions?: ValidationOptions): PropertyDecorator {
	return applyDecorators(IsOptional(validationOptions), ApiProperty({ required: false }));
}
