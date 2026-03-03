import { faker } from "@faker-js/faker";
import { CustomBaseEntity } from "../../../src/modules/db/entity/customBase.entity";
import { getRandomNumber } from "../../../src/utils/random";

type CustomBaseEntityStub = Omit<CustomBaseEntity, "deleted_date" | "updated_date"> & {
	deleted_date: Date | null;
	updated_date: Date;
};

export const factoryCustomBaseStub = (isDeleted?: boolean): CustomBaseEntityStub => {
	const START = "2024-03-15T10:25:45.123Z";
	const END = "2024-12-15T10:25:45.123Z";
	const now = new Date().toISOString();

	const created_date = faker.date.between({
		from: START,
		to: END,
	});
	const updated_date = faker.date.between({
		from: created_date,
		to: now,
	});
	return {
		created_date,
		updated_date,
		deleted_date: isDeleted ? updated_date : null,
		version: faker.number.int({ min: 0, max: 20 }),
	};
};

export const CustomBaseEntityStub = (isDeleted?: boolean): CustomBaseEntityStub => {
	return {
		created_date: new Date("2024-03-15T10:25:45.123Z"),
		updated_date: new Date("2024-05-20T14:32:11.456Z"),
		deleted_date: isDeleted ? new Date("2024-05-20T14:32:11.456Z") : null,
		version: getRandomNumber(0, 3),
	};
};
