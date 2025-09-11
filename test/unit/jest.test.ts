import * as assert from "node:assert";

describe("1-outer describe", () => {
	const nums: number[] = [0];

	beforeAll(() => {
		console.log("1-beforeAll", nums);
	});

	beforeEach(() => {
		console.log("1-beforeEach", nums);
		nums.push(nums.length);
	});

	//no test, so console "2-beforeAll" first.

	describe("2-a-outer describe", () => {
		beforeAll(() => {
			console.log("2-beforeAll", nums);
			assert(nums.length === 1);
		});

		it("number should be [0,1]", () => {
			expect(nums).toEqual([0, 1]);
		});
	});

	describe("2-b-outer describe", () => {
		const expected = [0, 1, 2];
		beforeAll(() => {
			console.log("scenario 2", nums);
			assert(nums.length === expected.length - 1);
		});

		it("number should be [0,1,2]", () => {
			expect(nums).toEqual(expected);
		});
	});

	describe.each([
		[0, 1, 2, 3],
		[0, 1, 2, 3, 4],
		[0, 1, 2, 3, 4, 5],
		[0, 1, 2, 3, 4, 5, 6],
	])("2-c-outer describe.each", (...expected) => {
		beforeAll(() => {
			console.log("2-c-outer describe.each beforeAll", nums);
			assert(nums.length === expected.length - 1);
		});

		it(`number should be ${expected.toString()}`, () => {
			expect(nums).toEqual(expected);
		});
	});
});

// test and describe is different.
// before* and after* hook be called before test and after test. not describe.
// describe is just grouping test and restrict before* and after* hook
describe("1-outer describe : beforeEach() test", () => {
	const nums: number[] = [0];

	beforeAll(() => {
		console.log("1-beforeAll", nums);
	});

	beforeEach(() => {
		console.log("1-beforeEach", nums);
		nums.push(nums.length);
	});

	//no test, so console "2-beforeAll" first.

	describe.each([
		[0, 1],
		[0, 1, 2, 3],
		[0, 1, 2, 3, 4, 5],
		[0, 1, 2, 3, 4, 5, 6, 7],
	])("2-c-outer describe.each", (...expected) => {
		beforeAll(() => {
			console.log("2-c-outer describe.each beforeAll", nums);
			assert(nums.length === expected.length - 1);
		});

		it(`number should be ${expected.toString()}`, () => {
			expect(nums).toEqual(expected);
		});

		it(`number should be ${[...expected, expected.length].toString()}`, () => {
			expect(nums).toEqual([...expected, expected.length]);
		});
	});
});

describe("jest-doc scoping", () => {
	//Result
	// 1 - beforeAll
	// 1 - beforeEach
	// 1 - test
	// 1 - afterEach
	// 2 - beforeAll
	// 1 - beforeEach
	// 2 - beforeEach
	// 2 - test
	// 2 - afterEach
	// 1 - afterEach
	// 2 - afterAll
	// 1 - afterAll
	beforeAll(() => console.log("1 - beforeAll"));
	afterAll(() => console.log("1 - afterAll"));
	beforeEach(() => console.log("1 - beforeEach"));
	afterEach(() => console.log("1 - afterEach"));

	test("", () => console.log("1 - test"));

	describe("Scoped / Nested block", () => {
		beforeAll(() => console.log("2 - beforeAll"));
		afterAll(() => console.log("2 - afterAll"));
		beforeEach(() => console.log("2 - beforeEach"));
		afterEach(() => console.log("2 - afterEach"));

		test("", () => console.log("2 - test"));
	});
});

describe("jest-doc scoping : sequence before* and after* hook", () => {
	//Result
	// 1 - beforeAll
	// 2 - beforeAll
	// 1 - beforeEach
	// 2 - beforeEach
	// 2 - test
	// 1 - afterEach
	// 2 - afterEach
	// 1 - afterEach
	// 2 - afterAll
	// 1 - afterAll
	beforeAll(() => console.log("1 - beforeAll"));
	afterAll(() => console.log("1 - afterAll"));
	beforeEach(() => console.log("1 - beforeEach"));
	afterEach(() => console.log("1 - afterEach"));
	describe("Scoped / Nested block", () => {
		beforeAll(() => console.log("2 - beforeAll"));
		afterAll(() => console.log("2 - afterAll"));
		beforeEach(() => console.log("2 - beforeEach"));
		afterEach(() => console.log("2 - afterEach"));

		test("", () => console.log("2 - test"));
	});
});
