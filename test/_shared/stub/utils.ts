// let currentId = faker.number.int({
// 	min: 0,
// 	max: 2 ** 31 - 1000,
// });
let currentId = 6433 * 1000;
console.log({ currentId });
export function generateId() {
	return currentId++;
}
