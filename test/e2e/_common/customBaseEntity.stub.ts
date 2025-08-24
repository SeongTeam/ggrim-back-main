import { CustomBaseEntity } from "../../../src/modules/db/entity/customBase.entity";
import { getRandomNumber } from "../../../src/utils/random";

export const CustomBaseEntityStub = (isDeleted?: boolean): CustomBaseEntity => {
	return {
		created_date: new Date("2024-03-15T10:25:45.123Z"),
		updated_date: new Date("2024-05-20T14:32:11.456Z"),
		deleted_date: isDeleted ? new Date("2024-05-20T14:32:11.456Z") : null,
		version: getRandomNumber(0, 3),
	};
};
