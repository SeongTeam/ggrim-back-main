/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
	ValidationArguments,
	ValidationOptions,
	ValidatorConstraint,
	ValidatorConstraintInterface,
	registerDecorator,
} from "class-validator";

@ValidatorConstraint({ async: false })
export class IsInArrayConstraint implements ValidatorConstraintInterface {
	validate(value: any, args: ValidationArguments): boolean {
		const [allowedValues] = args.constraints;
		return Array.isArray(allowedValues) && allowedValues.includes(value);
	}

	defaultMessage(validationArguments: ValidationArguments): string {
		const [allowedValues]: string[][] = validationArguments.constraints;
		const delimiter = ", ";
		const allowed = allowedValues.join(delimiter);
		return `${validationArguments.property} must be one of the following : ${allowed}`;
	}
}

export function IsInArray(validValues: readonly any[], validationOptions?: ValidationOptions) {
	return function (object: object, propertyName: string) {
		registerDecorator({
			name: "isInArray",
			target: object.constructor,
			propertyName: propertyName,
			constraints: [validValues],
			options: validationOptions,
			validator: IsInArrayConstraint,
		});
	};
}
