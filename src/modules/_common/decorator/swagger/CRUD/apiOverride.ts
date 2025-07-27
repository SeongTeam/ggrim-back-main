import { BaseRouteName, Override } from "@dataui/crud";
import { applyDecorators, Type } from "@nestjs/common";
import { ApiPaginationResponse } from "../apiPaginationResponse";
import { ApiOkResponse, getSchemaPath } from "@nestjs/swagger";

export function ApiOverride<TClass extends Type<any>>(
	overrideKey: BaseRouteName,
	responseDTO: TClass,
): MethodDecorator {
	const prefix = "ManyBase";

	const swaggers = overrideKey.includes(prefix)
		? [ApiPaginationResponse(responseDTO)]
		: [
				ApiOkResponse({
					schema: { $ref: getSchemaPath(responseDTO) },
				}),
			];

	return applyDecorators(Override(overrideKey), ...swaggers);
}
