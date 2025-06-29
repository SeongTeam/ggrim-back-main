import { readFileSync } from "fs";

export function loadObjectFromJSON<T>(inputJSON: string) {
	const readfilePath = inputJSON;
	const buffer = readFileSync(readfilePath, "utf-8");
	const objs = JSON.parse(buffer) as T;

	return objs;
}
