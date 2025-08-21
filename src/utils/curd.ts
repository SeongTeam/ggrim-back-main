import { CrudRequest } from "@dataui/crud";
import { CustomBaseEntity } from "../modules/db/entity/customBase.entity";

export function setJoinEager<Entity extends CustomBaseEntity>(
	req: CrudRequest,
	joinColumn: Extract<keyof Entity, string>,
): CrudRequest {
	const prevQuery = req.options.query ?? {};

	return {
		...req,
		options: {
			...req.options,
			query: {
				...prevQuery,
				join: {
					...prevQuery.join,
					[joinColumn]: {
						...prevQuery.join?.[joinColumn],
						eager: true,
					},
				},
			},
		},
	};
}
