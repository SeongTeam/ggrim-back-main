import { isArrayEmpty } from "./validator";

export function getRandomNumber(min: number, max: number): number {
	const index = Math.floor(Math.random() * (max - min + 1)) + min;

	return index;
}

export function getRandomElement<T>(list: T[]): T {
	if (isArrayEmpty<T>(list)) {
		throw Error("list is Empty. Can't choose one");
	}

	const min = 0;
	const max = list.length - 1;
	const idx = getRandomNumber(min, max);

	return list[idx];
}
export function selectRandomElements<T>(arr: T[], n: number): T[] {
	if (n < 0 || n > arr.length || arr.length === 0) {
		throw Error(`delivering wrong argument.  ${JSON.stringify({ length: arr.length, n })} `);
	}

	// 원본 배열의 복사본을 만들어 원본을 훼손하지 않습니다.
	const shuffledArr = [...arr];

	// 피셔-예이츠 셔플 알고리즘을 사용하여 배열을 무작위로 섞습니다.
	for (let i = shuffledArr.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffledArr[i], shuffledArr[j]] = [shuffledArr[j], shuffledArr[i]];
	}

	// 섞인 배열에서 앞에서부터 n개의 요소를 잘라내어 반환합니다.
	return shuffledArr.slice(0, n);
}
