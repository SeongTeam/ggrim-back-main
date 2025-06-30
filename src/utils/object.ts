import { ServiceException } from "../_common/filter/exception/service/serviceException";
import { isNotFalsy } from "./validator";

export function extractValues<T>(obj: T, key: keyof T): any[] {
	const fieldValues = new Set<any>();

	const field = obj[key];

	if (!field) {
		throw new ServiceException(
			"SERVICE_RUN_ERROR",
			"INTERNAL_SERVER_ERROR",
			`${String(key)} is falsy.
      obj : ${JSON.stringify(obj, null, 2)}`,
		);
	}

	if (Array.isArray(field)) {
		field.forEach((value) => fieldValues.add(value));
		return [...fieldValues];
	}

	fieldValues.add(field);

	return [...fieldValues];
}

export function extractValuesFromArray<T>(list: T[], key: keyof T): any[] {
	const fieldValues = new Set<any>();

	list.forEach((obj) => {
		const values = extractValues(obj, key);
		values.forEach((value) => fieldValues.add(value));
	});

	return [...fieldValues];
}

export function updateProperty<T>(obj: T, key: keyof T, value: T[keyof T] | undefined) {
	if (isNotFalsy(value)) {
		obj[key] = value;
	}
}
