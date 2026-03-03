import { Override } from "@dataui/crud";
import { applyDecorators, HttpCode, HttpStatus, Type } from "@nestjs/common";
import { ApiPaginationResponse } from "../apiPaginationResponse";
import { ApiOkResponse, getSchemaPath } from "@nestjs/swagger";

type UseRouteName = "getManyBase" | "createOneBase" | "replaceOneBase" | "getOneBase";

export function ApiOverride<TClass extends Type<any>>(
	overrideKey: UseRouteName,
	responseDTO: TClass,
): MethodDecorator {
	// 각 상황별 Swagger 데코레이터 맵핑

	const DecoratorMaps = {
		default: [
			ApiOkResponse({
				schema: { $ref: getSchemaPath(responseDTO) },
			}),
			HttpCode(HttpStatus.OK),
		],
		createOne: [
			ApiOkResponse({
				schema: { $ref: getSchemaPath(responseDTO) },
			}),
			HttpCode(HttpStatus.CREATED),
		],

		getMany: [ApiPaginationResponse(responseDTO, HttpStatus.OK), HttpCode(HttpStatus.OK)],
	};
	const responseDecorators: Record<UseRouteName, MethodDecorator[]> = {
		getManyBase: DecoratorMaps.getMany,
		createOneBase: DecoratorMaps.createOne,
		replaceOneBase: DecoratorMaps.default,
		getOneBase: DecoratorMaps.default,
	};

	return applyDecorators(Override(overrideKey), ...responseDecorators[overrideKey]);
}
