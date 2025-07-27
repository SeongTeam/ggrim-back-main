import { applyDecorators, Type } from "@nestjs/common";
import { ApiDefaultResponse, ApiExtraModels, ApiOkResponse, getSchemaPath } from "@nestjs/swagger";
import { Pagination } from "../../types";

export const ApiPaginationResponse = <TClass extends Type<any>>(model: TClass) =>
	applyDecorators(
		ApiExtraModels(Pagination, model),
		ApiOkResponse({
			schema: {
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
			},
		}),
		ApiDefaultResponse({
			schema: {
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
			},
		}),
	);
