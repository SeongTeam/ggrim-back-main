import { Override } from "@dataui/crud";
import { applyDecorators, HttpCode, HttpStatus, Type } from "@nestjs/common";
import { ApiPaginationResponse } from "../apiPaginationResponse";
import { ApiOkResponse, getSchemaPath } from "@nestjs/swagger";

type UseRouteName = "getManyBase" | "createOneBase" | "replaceOneBase";

export function ApiOverride<TClass extends Type<any>>(
	overrideKey: UseRouteName,
	responseDTO: TClass,
): MethodDecorator {
	// 각 상황별 Swagger 데코레이터 맵핑
	const responseDecorators: Record<UseRouteName, MethodDecorator[]> = {
		getManyBase: [ApiPaginationResponse(responseDTO, HttpStatus.OK), HttpCode(HttpStatus.OK)],
		createOneBase: [
			ApiOkResponse({
				schema: { $ref: getSchemaPath(responseDTO) },
			}),
			HttpCode(HttpStatus.CREATED),
		],
		replaceOneBase: [
			ApiOkResponse({
				schema: { $ref: getSchemaPath(responseDTO) },
			}),
			HttpCode(HttpStatus.OK),
		],
	};

	return applyDecorators(Override(overrideKey), ...responseDecorators[overrideKey]);
}
