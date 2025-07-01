import { ServiceException } from "../_common/filter/exception/service/serviceException";
import { isNotFalsy } from "./validator";

export function extractValues<T, K extends keyof T, R = T[K] extends Array<infer U> ? U : T[K]>(
	obj: T,
	key: K,
): R[] {
	const field = obj[key];

	if (!field) {
		throw new ServiceException(
			"SERVICE_RUN_ERROR",
			"INTERNAL_SERVER_ERROR",
			`${String(key)} is falsy.
			obj : ${JSON.stringify(obj, null, 2)}`,
		);
	}

	const fieldValues = new Set<R>();
	if (Array.isArray(field)) {
		field.forEach((value) => fieldValues.add(value as R));
	} else {
		fieldValues.add(field as R);
	}
	return [...fieldValues];
}

export function extractValuesFromArray<
	T,
	K extends keyof T,
	R = T[K] extends Array<infer U> ? U : T[K],
>(list: T[], key: keyof T): R[] {
	const fieldValues = new Set<R>();

	list.forEach((obj) => {
		const values = extractValues(obj, key);
		values.forEach((value) => fieldValues.add(value as R));
	});

	return [...fieldValues];
}

export function updateProperty<T>(obj: T, key: keyof T, value: T[keyof T] | undefined) {
	if (isNotFalsy(value)) {
		obj[key] = value;
	}
}
