import { isArrayEmpty } from "./validator";

export function getRandomNumber(min: number, max: number): number {
	const index = Math.floor(Math.random() * (max - min + 1)) + min;

	return index;
}

export function getRandomElement<T>(list: T[]): T | undefined {
	if (isArrayEmpty<T>(list)) {
		return undefined;
	}

	const min = 0;
	const max = list.length - 1;
	const idx = getRandomNumber(min, max);

	return list.at(idx);
}
