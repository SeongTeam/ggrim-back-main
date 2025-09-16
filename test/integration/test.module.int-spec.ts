import { Test, TestingModule } from "@nestjs/testing";
import { TestModule } from "../_shared/test.module";
import { InsertOneChoiceQuizzesArgs, TestService } from "../_shared/test.service";
import { DatabaseService } from "../../src/modules/db/db.service";
import { factoryUserStub } from "../_shared/stub/user.stub";
import { omit } from "../../src/utils/object";
import { factoryTagStub } from "../_shared/stub/tag.stub";
import { factoryArtistStub } from "../_shared/stub/artist.stub";
import { factoryStyleStub } from "../_shared/stub/style.stub";
import { factoryPaintingStub } from "../_shared/stub/painting.stub";
import { factoryQuizStub } from "../_shared/stub/quiz.stub";
import { USER_ROLE } from "../openapi/dto-types";
import { Painting } from "../../src/modules/painting/entities/painting.entity";
import { expectQuizEqual } from "../_shared/expect";
import { factoryQuizReaction } from "../e2e/quiz/quiz-reaction.stub";

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
			const stub = factoryUserStub("user");
			const users = await testService.insertUserStubs([stub]);
			const user = users[0];
			expect(user).toBeDefined();
			expect(stub).toMatchObject(omit(user, ["password"]));
		});
		test("insert tag data", async () => {
			const stub = factoryTagStub();
			const tags = await testService.insertTagStubs([stub]);

			const received = tags[0];
			expect(received).toBeDefined();
			expect(stub).toMatchObject(omit(received, ["paintings"]));
		});
		test("insert artist data", async () => {
			const stub = factoryArtistStub();
			const artists = await testService.insertArtistStubs([stub]);

			const received = artists[0];
			expect(received).toBeDefined();
			expect(stub).toMatchObject(omit(received, ["paintings"]));
		});
		test("insert style data", async () => {
			const stub = factoryStyleStub();
			const styles = await testService.insertStyleStubs([stub]);

			const received = styles[0];
			expect(received).toBeDefined();
			expect(stub).toMatchObject(omit(received, ["paintings"]));
		});

		test("insert painting data", async () => {
			const tags = await testService.seedTags(3);
			const artists = await testService.seedArtists(1);
			const styles = await testService.seedStyles(1);

			const paintingDummy = factoryPaintingStub();
			const paintings = await testService.insertPaintingStub([
				{
					paintingDummy,
					tags,
					artist: artists[0],
					styles,
				},
			]);

			const received = paintings[0];

			const updatedColumn = ["updated_date", "version"] as const;

			expect(received).toBeDefined();
			expect(received).toMatchObject(omit(paintingDummy, updatedColumn));
			expect(received.tags).toMatchObject(tags);
			expect(received.artist).toMatchObject(artists[0]);
			expect(received.styles).toMatchObject(styles);
		});

		test.each([{ userRole: USER_ROLE.admin }, { userRole: USER_ROLE.user }])(
			"insert quiz data by $userRole",
			async ({ userRole }) => {
				const paintings = await testService.seedPaintings(4);
				const answer = paintings.slice(0, 1)[0];
				const distractors = paintings.slice(1) as [Painting, Painting, Painting];
				const owner = await testService.insertStubUser(factoryUserStub(userRole));
				const quizStub = factoryQuizStub();
				const stub: InsertOneChoiceQuizzesArgs = {
					quizStub,
					answer,
					distractors,
					owner,
				};
				const quizzes = await testService.insertOneChoiceQuizStubs([stub]);
				const received = quizzes[0];

				const updatedColumn = ["updated_date", "version"] as const;
				const excludedColumn = "example_painting";

				expect(received).toBeDefined();
				expect(received).toMatchObject(omit(quizStub, [...updatedColumn, excludedColumn]));
				expectQuizEqual(received, {
					answer_paintings: [answer],
					distractor_paintings: distractors,
					description: quizStub.description,
					time_limit: quizStub.time_limit,
					title: quizStub.title,
					owner,
				});
			},
		);

		test.each([{ userRole: USER_ROLE.admin }, { userRole: USER_ROLE.user }])(
			"insert quiz like by $userRole",
			async ({ userRole }) => {
				const user = await testService.insertStubUser(factoryUserStub(userRole));
				const quizzes = await testService.seedOneChoiceQuizzes(1);
				const targetQuiz = quizzes[0];

				const quizLikeStub = factoryQuizReaction("like");
				const quizLikes = await testService.insertQuizReaction([
					{ reactionStub: quizLikeStub, quiz: targetQuiz, user },
				]);

				const receivedQuizLike = quizLikes[0];
				const quizRelationsField = [
					"answer_paintings",
					"distractor_paintings",
					"artists",
					"tags",
					"styles",
					"owner",
				] as const;

				expect(receivedQuizLike).toBeDefined();
				expect(receivedQuizLike).toMatchObject(quizLikeStub);
				expect(receivedQuizLike.user).toEqual(user);
				expect(receivedQuizLike.quiz).toEqual(omit(targetQuiz, quizRelationsField));
			},
		);

		test.each([{ userRole: USER_ROLE.admin }, { userRole: USER_ROLE.user }])(
			"insert quiz dislike by $userRole",
			async ({ userRole }) => {
				const user = await testService.insertStubUser(factoryUserStub(userRole));
				const quizzes = await testService.seedOneChoiceQuizzes(1);
				const targetQuiz = quizzes[0];

				const quizDislikeStub = factoryQuizReaction("like");
				const quizDislikes = await testService.insertQuizReaction([
					{ reactionStub: quizDislikeStub, quiz: targetQuiz, user },
				]);

				const quizDislike = quizDislikes[0];

				const quizRelationsField = [
					"answer_paintings",
					"distractor_paintings",
					"artists",
					"tags",
					"styles",
					"owner",
				] as const;

				expect(quizDislike).toBeDefined();
				expect(quizDislike).toMatchObject(quizDislikeStub);
				expect(quizDislike.user).toEqual(user);
				expect(quizDislike.quiz).toEqual(omit(targetQuiz, quizRelationsField));
			},
		);
	});

	describe("test seed limitation", () => {
		describe.each([{ count: 5 }, { count: 10 }, { count: 20 }, { count: 40 }, { count: 80 }])(
			"should seed user limitation  : [$count]",
			({ count }) => {
				it("call seedUsersMultipleInsert()", async () => {
					console.log(`seed data count : ${count}`);
					const users = await testService.seedUsersMultipleInsert(count);
					expect(users.length).toBe(count);
				});

				it("call seedUsersSingleInsert()", async () => {
					console.log(`seed data count : ${count}`);
					const users = await testService.seedUsersSingleInsert(count);
					expect(users.length).toBe(count);
				});
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
		])("test seed painting limitation : [$count]", async ({ count }) => {
			console.log(`seed data count : ${count}`);
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
			"test seed quiz limitation [$count]",
			async ({ count }) => {
				console.log(`seed data count : ${count}`);
				const quizzes = await testService.seedOneChoiceQuizzes(count);
				expect(quizzes.length).toBe(count);
			},
			//50 * 1000,
		);

		it.each([
			{ count: 5 },
			{ count: 10 },
			{ count: 20 },
			{ count: 40 },
			{ count: 80 },
			{ count: 160 },
		])(
			"test seed quiz reaction limitation [$count]",
			async ({ count }) => {
				console.log(`seed data count : ${count}`);
				const quizzes = await testService.seedQuizReaction(count, "like");
				expect(quizzes.length).toBe(count);
			},
			//50 * 1000,
		);

		it.each([
			{ count: 5 },
			{ count: 10 },
			{ count: 20 },
			{ count: 40 },
			{ count: 80 },
			{ count: 160 },
		])(
			"test seed quiz reaction limitation [$count]",
			async ({ count }) => {
				console.log(`seed data count : ${count}`);
				const quizzes = await testService.seedQuizReaction(count, "dislike");
				expect(quizzes.length).toBe(count);
			},
			//50 * 1000,
		);
	});
});
