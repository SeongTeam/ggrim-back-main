import { Test, TestingModule } from "@nestjs/testing";
import { TestModule } from "../_shared/test.module";
import { TestService } from "../_shared/test.service";
import { DatabaseService } from "../../src/modules/db/db.service";
import { factoryUserStub } from "../_shared/stub/user.stub";
import { omit } from "../../src/utils/object";

describe("TestModule Integration Test", () => {
	let module: TestingModule;
	let testService: TestService;
	let dbService: DatabaseService;
	let startTime: bigint;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [TestModule],
		}).compile();

		testService = module.get<TestService>(TestService);
		dbService = module.get<DatabaseService>(DatabaseService);
		await dbService.resetDB();
	});

	beforeEach(() => {
		startTime = process.hrtime.bigint();
	});

	afterEach(() => {
		const duration = Number(process.hrtime.bigint() - startTime) / 1e6; // ms 단위
		console.log(`Test "${expect.getState().currentTestName}" took ${duration.toFixed(3)} ms`);
	});

	afterAll(async () => {
		await module.close();
	});

	describe("test data insert", () => {
		test("insert user data", async () => {
			const userStub = factoryUserStub("user");
			const user = await testService.insertStubUser(userStub);

			expect(user).toBeDefined();
			expect(userStub).toMatchObject(omit(user, ["password"]));
		});
	});

	describe("test seed limitation", () => {
		it.each([{ count: 5 }, { count: 10 }, { count: 20 }, { count: 40 }, { count: 80 }])(
			"should seed user limitation",
			async ({ count }) => {
				const users = await testService.seedUsers(count);
				expect(users.length).toBe(count);
			},
		);

		it.each([
			{ count: 5 },
			{ count: 10 },
			{ count: 20 },
			{ count: 40 },
			{ count: 80 },
			{ count: 160 },
			{ count: 320 },
			{ count: 640 },
		])("should seed painting limitation", async ({ count }) => {
			const paintings = await testService.seedPaintings(count);
			expect(paintings.length).toBe(count);
		});
		it.each([
			{ count: 5 },
			{ count: 10 },
			{ count: 20 },
			{ count: 40 },
			{ count: 80 },
			{ count: 160 },
		])(
			"test seed quiz limitation",
			async ({ count }) => {
				const quizzes = await testService.seedOneChoiceQuizzes(count);
				expect(quizzes.length).toBe(count);
			},
			//50 * 1000,
		);
	});
});
