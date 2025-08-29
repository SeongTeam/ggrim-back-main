import { BaseRouteName, Override } from "@dataui/crud";
import { applyDecorators, HttpCode, HttpStatus, Type } from "@nestjs/common";
import { ApiPaginationResponse } from "../apiPaginationResponse";
import { ApiCreatedResponse, ApiOkResponse, getSchemaPath } from "@nestjs/swagger";

export function ApiOverride<TClass extends Type<any>>(
	overrideKey: BaseRouteName,
	responseDTO: TClass,
): MethodDecorator {
	const swaggers = [];

	if (overrideKey.includes("ManyBase")) {
		swaggers.push(ApiPaginationResponse(responseDTO));
	}

	if (overrideKey.includes("create")) {
		swaggers.push(
			ApiCreatedResponse({
				schema: { $ref: getSchemaPath(responseDTO) },
			}),
			HttpCode(HttpStatus.CREATED),
		);
	} else {
		swaggers.push(
			ApiOkResponse({
				schema: { $ref: getSchemaPath(responseDTO) },
			}),
			HttpCode(HttpStatus.OK),
		);
	}

	return applyDecorators(Override(overrideKey), ...swaggers);
}
