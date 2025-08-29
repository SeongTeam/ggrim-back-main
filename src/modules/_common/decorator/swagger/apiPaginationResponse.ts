import { applyDecorators, HttpStatus, Type } from "@nestjs/common";
import {
	ApiCreatedResponse,
	ApiDefaultResponse,
	ApiExtraModels,
	ApiOkResponse,
	getSchemaPath,
} from "@nestjs/swagger";
import { Pagination } from "../../types";

export const ApiPaginationResponse = <TClass extends Type<any>>(
	model: TClass,
	status: HttpStatus.OK | HttpStatus.CREATED = HttpStatus.OK,
) => {
	const schema = {
		title: `PaginatedResponseOf${model.name}`,
		allOf: [
			{ $ref: getSchemaPath(Pagination) },
			{
				properties: {
					data: {
						type: "array",
						items: { $ref: getSchemaPath(model) },
					},
				},
			},
		],
	};
	const responseSchemaMap = {
		[HttpStatus.OK]: ApiOkResponse({
			schema,
		}),
		[HttpStatus.CREATED]: ApiCreatedResponse({
			schema,
		}),
	};

	return applyDecorators(
		ApiExtraModels(Pagination, model),
		responseSchemaMap[status],
		ApiDefaultResponse({
			schema,
		}),
	);
};
