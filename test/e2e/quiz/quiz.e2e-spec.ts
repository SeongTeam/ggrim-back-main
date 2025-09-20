import { HttpStatus, INestApplication } from "@nestjs/common";
import { DatabaseService } from "../../../src/modules/db/db.service";
import { TestService } from "../../_shared/test.service";
import { PaintingService } from "../../../src/modules/painting/painting.service";
import createClient from "openapi-fetch";
import { Test, TestingModule } from "@nestjs/testing";
import { AppModule } from "../../../src/app.module";
import { TestModule } from "../../_shared/test.module";
import { configNestApp } from "../../../src/app.config";
import { factoryUserStub } from "../../_shared/stub/user.stub";
import {
	ApiPaths,
	CreateQuizDto,
	paths,
	QUIZ_REACTION,
	QUIZ_TYPE,
	QuizContextDto,
	CreateQuizReactionDto,
	SubmitQuizDto,
	ReplaceQuizDto,
	ScheduleQuizResponse,
} from "../../openapi/dto-types";
import { QuizService } from "../../../src/modules/quiz/quiz.service";
import { faker } from "@faker-js/faker";
import { factoryQuizStub } from "../../_shared/stub/quiz.stub";
import { omit, pick } from "../../../src/utils/object";
import { Quiz } from "../../../src/modules/quiz/entities/quiz.entity";
import { QuizBatchService } from "../../../src/modules/quiz/batch/quiz.batch.service";
import { QuizLike } from "../../../src/modules/quiz/entities/quizLike.entity";
import { QuizDislike } from "../../../src/modules/quiz/entities/quizDislike.entity";
import { ShowQuizReactionResponse } from "../../../src/modules/quiz/dto/response/showQuizReaction.response";
import { expectResponseBody } from "../_common/jest-zod";
import {
	zDetailQuizResponse,
	zScheduleQuizResponse,
	zShowQuiz,
	zShowQuizReactionResponse,
	zShowQuizResponse,
} from "./zSchema";
import { Painting } from "../../../src/modules/painting/entities/painting.entity";
import {
	ShowQuiz,
	ShowQuizResponse,
} from "../../../src/modules/quiz/dto/response/showQuiz.response";
import { zPagination } from "../_common/zodSchema";
import { DetailQuizResponse } from "../../../src/modules/quiz/dto/response/detailQuiz.response";
import { QuizScheduleService } from "../../../src/modules/quiz/schedule/quizSchedule.service";
import { ExpectedQuizPart, expectQuizEqual } from "../../_shared/expect";
import { USER_ROLE } from "../../../src/modules/user/const";
import { User } from "../../../src/modules/user/entity/user.entity";
import z from "zod";
import { getRandomElement, selectRandomElements } from "../../../src/utils/random";
import { factoryTagStub } from "../../_shared/stub/tag.stub";
import { factoryArtistStub } from "../../_shared/stub/artist.stub";
import { factoryStyleStub } from "../../_shared/stub/style.stub";
import { isNotFalsy } from "../../../src/utils/validator";
import { factoryPaintingStub } from "../../_shared/stub/painting.stub";
import { assert } from "console";
import { UserService } from "../../../src/modules/user/user.service";

// TODO: QuizController API 테스트 구현
// - [x] API 별로 테스트 시나리오 설계
// - [x] API e2e 공통 로직 설계
// - [x] 응답 객체 zodSchema 구현
// - [x] QuizStub 객체 정의
// - [x] QuizStub 생성 로직 구현
// - [x] 퀴즈 데이터 시딩 로직 구현
// - [x] 디버깅 환경의 테스트 timeout 시간 연장 설정
// ! 주의: <경고할 사항>
// ? 질문: <의문점 또는 개선 방향>
// * 참고: <관련 정보나 링크>

if (process.env.VSCODE_INSPECTOR_OPTIONS) {
	console.log("Set setTimeout for debugging");
	jest.setTimeout(60 * 1000 * 10); // 10 minutes
}

describe("QuizController (e2e)", () => {
	let app: INestApplication;
	let dbService: DatabaseService;
	let testService: TestService;
	let paintingService: PaintingService;
	let quizService: QuizService;
	let quizBatchService: QuizBatchService;
	let quizScheduleService: QuizScheduleService;
	let userService: UserService;
	const port = 3001;
	const client = createClient<paths>({ baseUrl: `http://localhost:${port}` });

	async function findAllRelationQuiz(
		id: string,
		withDeleted: boolean = false,
	): Promise<Quiz | null> {
		const ret = await quizService.findOne({
			where: { id },
			relations: {
				answer_paintings: true,
				distractor_paintings: true,
				artists: true,
				tags: true,
				styles: true,
				owner: true,
			},
			withDeleted,
		});

		return ret;
	}

	beforeAll(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [AppModule, TestModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		configNestApp(app);
		await app.init();

		testService = moduleFixture.get(TestService);
		dbService = moduleFixture.get(DatabaseService);
		paintingService = moduleFixture.get(PaintingService);
		quizService = moduleFixture.get(QuizService);
		quizBatchService = moduleFixture.get(QuizBatchService);
		quizScheduleService = moduleFixture.get(QuizScheduleService);
		userService = moduleFixture.get(UserService);
		await dbService.resetDB();
		await app.listen(port);
	});

	afterAll(async () => {
		//await dbService.resetDB();
		await app.close();
	});

	describe("/quiz/submit/:id (POST)", () => {
		// TODO: "/quiz/submit/:id (POST)" e2e 테스트 구현
		// - [x] 공통 로직 구현
		// - [x] 좋은 데이터 테스트 (모든 dto 경우에 대해 테스트)
		// - [x] 나쁜 데이터 테스트 (비유효 path)
		// - [x] 나쁜 데이터 테스트 (비유효 dto)
		async function requestSubmitQuiz(id: string, dto: SubmitQuizDto) {
			const response = await client.POST(ApiPaths.QuizController_submitQuiz, {
				params: {
					path: { id },
				},
				body: dto,
			});

			return response;
		}
		describe("success when valid dto", () => {
			describe.each([{ dto: { isCorrect: true } }, { dto: { isCorrect: false } }])(
				"input : %p",
				({ dto }) => {
					let expectedQuiz: Quiz;
					let receivedRes: Awaited<ReturnType<typeof requestSubmitQuiz>>;
					let receivedQuiz: Quiz;
					const field = dto.isCorrect ? "correct_count" : "incorrect_count";
					beforeAll(async () => {
						const quizzes = await testService.seedOneChoiceQuizzes(1);
						expectedQuiz = quizzes[0];
						expectedQuiz[field]++;
						receivedRes = await requestSubmitQuiz(expectedQuiz.id, dto);

						//run batch
						await quizBatchService.flushSubmissionMap();
						receivedQuiz = (await findAllRelationQuiz(expectedQuiz.id))!;
					});

					it("response should match openapi", () => {
						expect(receivedRes.response.status).toBe(HttpStatus.CREATED);
					});

					it("quiz correct count should be updated ", () => {
						const omitKeys = ["updated_date", "version"] as const;

						expect(omit(receivedQuiz, omitKeys)).toEqual(omit(expectedQuiz, omitKeys));
					});
				},
			);
		});
		describe("fail when invalid path, dto", () => {
			const validId = faker.string.uuid();

			beforeAll(async () => {
				const [answer, ...distractors] = await testService.seedPaintings(4);
				const [owner] = await testService.seedUsersSingleInsert(1);
				const quizStub = factoryQuizStub();
				quizStub.id = validId;

				await testService.insertOneChoiceQuizStubs([
					{
						quizStub,
						answer,
						distractors: distractors as [Painting, Painting, Painting],
						owner,
					},
				]);
			});

			describe.each([
				{
					testName: "deliver id not existed and dto with true",
					id: faker.string.uuid(),
					dto: { isCorrect: true },
				},
				{
					testName: "deliver id not existed and dto with false",
					id: faker.string.uuid(),
					dto: { isCorrect: false },
				},
				{
					testName: "deliver dto with undefined value",
					id: validId,
					dto: { isCorrect: undefined },
				},
				{
					testName: "deliver dto with invalid value 0",
					id: validId,
					dto: { isCorrect: 0 },
				},
				{
					testName: "deliver dto with invalid value 1234",
					id: validId,
					dto: { isCorrect: 1234 },
				},
				{
					testName: "deliver empty dto",
					id: validId,
					dto: {},
				},
			])("test : $testName", ({ id, dto }) => {
				let receivedRes: Awaited<ReturnType<typeof requestSubmitQuiz>>;

				beforeAll(async () => {
					receivedRes = await requestSubmitQuiz(id, dto as { isCorrect: boolean });

					//run batch
					await quizBatchService.flushSubmissionMap();
				});

				it("response should match openapi ", () => {
					expect(receivedRes.response.status).toBe(HttpStatus.BAD_REQUEST);
				});
			});
		});
	});

	describe("/quiz/:id/reactions (GET)", () => {
		// TODO: "/quiz/:id/reactions (GET)" e2e 테스트 구현
		// - [x] 공통 로직 구현
		// - [x] 좋은 데이터 테스트 (:id path)
		// - [x] 나쁜 데이터 테스트 (비유효 :id path)
		async function requestReadReactions(id: string) {
			const response = await client.GET(ApiPaths.QuizController_getQuizReactions, {
				params: {
					path: { id },
				},
			});

			return response;
		}

		describe("success when deliver quiz id", () => {
			let expectedLikeReactions: QuizLike[];
			let receivedRes: Awaited<ReturnType<typeof requestReadReactions>>;
			beforeAll(async () => {
				const likeReactions = await testService.seedQuizReaction(20, "like");
				const targetQuiz = likeReactions[0].quiz;
				expectedLikeReactions = likeReactions.filter(
					(like) => like.quiz_id === targetQuiz.id,
				);

				receivedRes = await requestReadReactions(targetQuiz.id);
			});

			it("response should match openapi doc", () => {
				expect(receivedRes.response.status).toBe(HttpStatus.OK);
				expectResponseBody(zShowQuizReactionResponse.array(), receivedRes.data);
			});

			it("response should read db resource ", () => {
				const receivedData = receivedRes.data!.sort((data1, data2) =>
					data1.user.id.localeCompare(data2.user.id),
				);
				const expectedData = expectedLikeReactions
					.sort((data1, data2) => data1.user.id.localeCompare(data2.user.id))
					.map((reaction) => new ShowQuizReactionResponse(reaction));

				expect(receivedData).toEqual(expectedData);
			});
		});

		describe("fail when deliver invalid id ", () => {
			describe.each([
				{
					invalidId: faker.string.uuid(),
				},
				{
					invalidId: faker.string.ulid(),
				},
			])("input : %p", ({ invalidId }) => {
				let receivedRes: Awaited<ReturnType<typeof requestReadReactions>>;
				beforeAll(async () => {
					const response = await requestReadReactions(invalidId);
					receivedRes = response;
				});

				it("status should be 400(Bad Request)", () => {
					expect(receivedRes.response.status).toBe(HttpStatus.BAD_REQUEST);
				});
			});
		});
	});

	describe("/quiz/:id/reactions (POST)", () => {
		// TODO: "/quiz/:id/reactions (POST)" e2e 테스트 구현
		// - [x] 공통 로직 구현
		// - [x] 좋은 데이터 테스트 ( id: path, query,dto body)
		// - [x] 나쁜 데이터 테스트 (비유효 query, dto body)
		// - [x] 나쁜 데이터 테스트 (비권한 authorization header )
		// - [x] 임계 영역 테스트 ( like, dislike 연속 생성)
		async function requestCreateReaction(
			id: string,
			dto: CreateQuizReactionDto,
			bearerAuth: string,
		) {
			const response = await client.POST(ApiPaths.QuizController_createQuizReaction, {
				params: {
					path: { id },
					header: {
						authorization: bearerAuth,
					},
				},
				body: dto,
			});

			return response;
		}
		describe("success when deliver query and dto", () => {
			describe.each([
				{ dto: { type: QUIZ_REACTION.dislike }, userType: USER_ROLE.USER },
				{ dto: { type: QUIZ_REACTION.like }, userType: USER_ROLE.USER },
				{ dto: { type: QUIZ_REACTION.dislike }, userType: USER_ROLE.ADMIN },
				{ dto: { type: QUIZ_REACTION.like }, userType: USER_ROLE.ADMIN },
			])("input : %p", ({ dto, userType }) => {
				let receivedRes: Awaited<ReturnType<typeof requestCreateReaction>>;
				let receivedReaction: QuizLike | QuizDislike;

				beforeAll(async () => {
					const quizzes = await testService.seedOneChoiceQuizzes(1);
					const testUser = await testService.insertStubUser(factoryUserStub(userType));
					const expectedQuiz = quizzes[0];

					const auth = testService.getBearerAuthCredential(testUser);
					const response = await requestCreateReaction(expectedQuiz.id, dto, auth);
					receivedRes = response;

					const findReactionFuncMap = {
						[QUIZ_REACTION.like]: (quiz_id: string, user_id: string) =>
							quizService.findQuizLikes({ where: { quiz_id, user_id } }),
						[QUIZ_REACTION.dislike]: (quiz_id: string, user_id: string) =>
							quizService.findQuizDislikes({ where: { quiz_id, user_id } }),
					};

					const reactions = await findReactionFuncMap[dto.type](
						expectedQuiz.id,
						testUser.id,
					);
					receivedReaction = reactions[0];
				});

				it("status should be created", () => {
					expect(receivedRes.response.status).toBe(HttpStatus.CREATED);
				});

				it("reaction entity should be created", () => {
					expect(receivedReaction).toBeDefined();
				});
			});
		});
		describe("success when reactions is already created", () => {
			describe.each([
				{ postReactionType: QUIZ_REACTION.like, laterReactionType: QUIZ_REACTION.dislike },
				{ postReactionType: QUIZ_REACTION.dislike, laterReactionType: QUIZ_REACTION.like },
				{ postReactionType: QUIZ_REACTION.like, laterReactionType: QUIZ_REACTION.like },
				{
					postReactionType: QUIZ_REACTION.dislike,
					laterReactionType: QUIZ_REACTION.dislike,
				},
			])("input : %p", ({ postReactionType, laterReactionType }) => {
				let receivedRes: Awaited<ReturnType<typeof requestCreateReaction>>;
				let laterReaction: QuizLike | QuizDislike;
				let postReaction: QuizLike | QuizDislike;

				beforeAll(async () => {
					let reactions: QuizLike[] | QuizDislike[] = [];
					if (postReactionType === QUIZ_REACTION.like) {
						reactions = await testService.seedQuizReaction(5, postReactionType);
					} else {
						reactions = await testService.seedQuizReaction(5, postReactionType);
					}

					const targetReaction = reactions[0];
					const expectedQuiz = targetReaction.quiz;
					const user = targetReaction.user;

					const auth = testService.getBearerAuthCredential(user);
					const dto: CreateQuizReactionDto = {
						type: laterReactionType,
					};
					const response = await requestCreateReaction(expectedQuiz.id, dto, auth);
					receivedRes = response;
					const findReactionFuncMap = {
						[QUIZ_REACTION.like]: (quiz_id: string, user_id: string) =>
							quizService.findQuizLikes({ where: { quiz_id, user_id } }),
						[QUIZ_REACTION.dislike]: (quiz_id: string, user_id: string) =>
							quizService.findQuizDislikes({ where: { quiz_id, user_id } }),
					};
					laterReaction = (
						await findReactionFuncMap[laterReactionType](expectedQuiz.id, user.id)
					)[0];
					postReaction = (
						await findReactionFuncMap[postReactionType](expectedQuiz.id, user.id)
					)[0];
				});

				it("response should match open api", () => {
					expect(receivedRes.response.status).toBe(HttpStatus.CREATED);
				});

				it(`later reaction should be created when post reaction is opposite. 
					later reaction is equal to post reaction when reaction is same `, () => {
					if (postReactionType !== laterReactionType) {
						expect(postReaction).toBeUndefined();
						expect(laterReaction).toBeDefined();
					} else {
						expect(laterReaction).toEqual(postReaction);
					}
				});
			});
		});

		describe.each([{ userType: USER_ROLE.USER }, { userType: USER_ROLE.ADMIN }])(
			"fail when deliver invalid id or dto by User($userType)",
			({ userType }) => {
				const validQuizId = faker.string.uuid();
				let testUser: User;

				beforeAll(async () => {
					const [answer, ...distractors] = await testService.seedPaintings(4);
					const [owner] = await testService.seedUsersSingleInsert(1);
					const quizStub = factoryQuizStub();
					quizStub.id = validQuizId;

					await testService.insertOneChoiceQuizStubs([
						{
							quizStub,
							answer,
							distractors: distractors as [Painting, Painting, Painting],
							owner,
						},
					]);
					testUser = await testService.insertStubUser(factoryUserStub(userType));
				});

				describe.each([
					{
						testName: "deliver dto with invalid value",
						id: validQuizId,
						dto: { type: "invalid" },
					},
					{
						testName: "deliver empty dto",
						id: validQuizId,
						dto: {},
					},
					{
						testName: "deliver id not existed with dislike",
						id: faker.string.uuid(),
						dto: { type: QUIZ_REACTION.dislike },
					},
					{
						testName: "deliver id not existed with like ",
						id: faker.string.uuid(),
						dto: { type: QUIZ_REACTION.like },
					},
					{
						testName: "deliver id disallowed format ",
						id: faker.internet.email(),
						dto: { type: QUIZ_REACTION.dislike },
					},
				])("test : $testName", ({ id, dto }) => {
					let receivedRes: Awaited<ReturnType<typeof requestCreateReaction>>;
					let receivedReaction: QuizLike;

					beforeAll(async () => {
						const auth = testService.getBearerAuthCredential(testUser);
						const response = await requestCreateReaction(
							id,
							dto as CreateQuizReactionDto,
							auth,
						);
						receivedRes = response;

						const uuidSchema = z.uuid();
						const isUUID = uuidSchema.safeParse(id);
						if (isUUID.success)
							receivedReaction = (
								await quizService.findQuizLikes({
									where: {
										quiz_id: id,
										user_id: testUser.id,
									},
								})
							)[0];
					});

					it("response should match openapi", () => {
						expect(receivedRes.response.status).toBe(HttpStatus.BAD_REQUEST);
					});

					it("reaction entity should be not created", () => {
						expect(receivedReaction).toBeUndefined();
					});
				});
			},
		);

		describe("fail when deliver invalid authorization", () => {
			let receivedRes: Awaited<ReturnType<typeof requestCreateReaction>>;

			beforeAll(async () => {
				const quizzes = await testService.seedOneChoiceQuizzes(1);
				const expectedQuiz = quizzes[0];

				const dto: CreateQuizReactionDto = {
					type: QUIZ_REACTION.like,
				};

				const invalidBearerAuth = faker.internet.jwt();
				const response = await requestCreateReaction(
					expectedQuiz.id,
					dto,
					invalidBearerAuth,
				);
				receivedRes = response;
			});

			it("response should match openapi", () => {
				expect(receivedRes.response.status).toBe(HttpStatus.UNAUTHORIZED);
			});
		});
	});

	describe("/quiz/:id/reactions (DELETE)", () => {
		// TODO: "/quiz/:id/reactions (DELETE)" e2e 테스트 구현
		// - [x] 공통 로직 구현
		// - [x] 좋은 데이터 테스트 (:id path)
		// - [x] 예외 상황 테스트 (  )
		// - [x] 나쁜 데이터 테스트 (비유효 :id path)
		async function requestDeleteReaction(id: string, bearerAuth: string) {
			const response = await client.DELETE(ApiPaths.QuizController_deleteQuizReaction, {
				params: {
					path: { id },
					header: {
						authorization: bearerAuth,
					},
				},
			});

			return response;
		}
		describe("success when deliver valid data", () => {
			//일반사용자, 운영자 계정 삭제

			describe.each([
				{ reactionType: QUIZ_REACTION.dislike, userType: USER_ROLE.USER },
				{ reactionType: QUIZ_REACTION.like, userType: USER_ROLE.USER },
				{ reactionType: QUIZ_REACTION.dislike, userType: USER_ROLE.ADMIN },
				{ reactionType: QUIZ_REACTION.like, userType: USER_ROLE.ADMIN },
			])("input : %o", ({ reactionType, userType }) => {
				let receivedRes: Awaited<ReturnType<typeof requestDeleteReaction>>;
				let receivedReaction: QuizLike | QuizDislike;

				beforeAll(async () => {
					let reactions: QuizLike[] | QuizDislike[] = [];
					if (reactionType === QUIZ_REACTION.like) {
						reactions = await testService.seedQuizReaction(5, reactionType, userType);
					} else {
						reactions = await testService.seedQuizReaction(5, reactionType, userType);
					}
					const deletedReaction = reactions[0];
					const expectedQuiz = deletedReaction.quiz;
					const user = deletedReaction.user;

					const auth = testService.getBearerAuthCredential(user);
					const response = await requestDeleteReaction(expectedQuiz.id, auth);
					receivedRes = response;
					const findReactionFuncMap = {
						[QUIZ_REACTION.like]: (quiz_id: string, user_id: string) =>
							quizService.findQuizLikes({ where: { quiz_id, user_id } }),
						[QUIZ_REACTION.dislike]: (quiz_id: string, user_id: string) =>
							quizService.findQuizDislikes({ where: { quiz_id, user_id } }),
					};
					receivedReaction = (
						await findReactionFuncMap[reactionType](expectedQuiz.id, user.id)
					)[0];
				});

				it("response should match openapi", () => {
					expect(receivedRes.response.status).toBe(HttpStatus.OK);
				});

				it("reaction should be deleted", () => {
					expect(receivedReaction).toBeUndefined();
				});
			});
		});
		describe("success when Exception situation that no reaction to delete)", () => {
			describe.each([{ userType: USER_ROLE.USER }, { userType: USER_ROLE.ADMIN }])(
				"input : %o",
				({ userType }) => {
					let receivedRes: Awaited<ReturnType<typeof requestDeleteReaction>>;
					let receivedReaction: QuizDislike;

					beforeAll(async () => {
						const quizzes = await testService.seedOneChoiceQuizzes(1);
						const users = await testService.seedUsersSingleInsert(1, userType);
						const quiz = quizzes[0];
						const user = users[0];

						//request delete reaction
						const auth = testService.getBearerAuthCredential(user);
						const response = await requestDeleteReaction(quiz.id, auth);
						receivedRes = response;
						receivedReaction = (
							await quizService.findQuizDislikes({
								where: {
									quiz_id: quiz.id,
									user_id: user.id,
								},
								withDeleted: true,
							})
						)[0];
					});

					it("response should match openapi", () => {
						expect(receivedRes.response.status).toBe(HttpStatus.OK);
					});

					it("deleted reaction should be found", () => {
						expect(receivedReaction).toBeUndefined();
					});
				},
			);
		});

		describe("fail when deliver invalid id", () => {
			//TODO 테스트 케이스 추가
			//-[x] 삭제된 Quiz id
			//-[x] 비유효 id
			//-[x] UUID 형식 이외의 ID
			const deletedQuizId = faker.string.uuid();

			beforeAll(async () => {
				const owner = (await testService.seedUsersSingleInsert(1))[0];
				const [answer, ...distractors] = await testService.seedPaintings(4);
				const quizStub = factoryQuizStub();
				quizStub.id = deletedQuizId;

				await testService.insertOneChoiceQuizStubs([
					{
						answer,
						owner,
						quizStub,
						distractors: distractors as [Painting, Painting, Painting],
					},
				]);

				const qr = dbService.getQueryRunner();
				await quizService.softDeleteQuiz(qr, deletedQuizId);
				await qr.release();
			});

			describe.each([
				{ invalidQuizId: deletedQuizId },
				{ invalidQuizId: faker.string.uuid() },
				{ invalidQuizId: faker.internet.email() },
			])("input : %o", ({ invalidQuizId }) => {
				let receivedRes: Awaited<ReturnType<typeof requestDeleteReaction>>;

				beforeAll(async () => {
					const testUser = await testService.insertStubUser(factoryUserStub("user"));

					//request delete reaction
					const auth = testService.getBearerAuthCredential(testUser);
					const response = await requestDeleteReaction(invalidQuizId, auth);
					receivedRes = response;
				});

				it("response should match openapi", () => {
					expect(receivedRes.response.status).toBe(HttpStatus.BAD_REQUEST);
				});
			});
		});
	});

	describe("/quiz/schedule (GET)", () => {
		// TODO: "/quiz/schedule (GET)" e2e 테스트 구현
		// - [x] 공통 로직 구현
		// - [x] Quiz Schedule 초기화
		// - [x] 시나리오별 공통 테스트 환경
		// - [x] 좋은 데이터 테스트 (최소한의 query)
		// - [x] 좋은 데이터 테스트 (최대한의 query)
		// - [x] 좋은 데이터 테스트 (유효한 custom query)
		// - [x] 나쁜 데이터 테스트 (비유효 query)
		// - [x] 나쁜 데이터 테스트 (비유효 query, 매우큰 정수 값)

		type ScheduleQuizQuery = {
			context?: QuizContextDto;
			currentIndex?: number;
			endIndex?: number;
		};

		async function requestReadScheduleQuiz(query: ScheduleQuizQuery) {
			const response = await client.GET(ApiPaths.QuizController_getScheduledQuiz, {
				params: {
					query,
				},
			});

			return response;
		}

		async function expectScheduleQuiz(query: ScheduleQuizQuery, res: ScheduleQuizResponse) {
			//TODO Schedule Quiz API 검증 구현
			//- [x] 요청 context와 응답 context 일치 검증
			//- [x] 응답 scheduled quiz 검증
			//- [x] 응답 scheduled quiz와 응답 context 연관성 검증
			//- [x] context에 해당하는 퀴즈가 없는 경우에 대한 예외상황 구현

			const { currentIndex, endIndex, context } = query;

			if (isNotFalsy(currentIndex) && isNotFalsy(endIndex) && isNotFalsy(context)) {
				if (currentIndex < endIndex) {
					const expectedContext = context;
					const receivedContext = res.context;
					expect(receivedContext).toEqual(expectedContext);
				}
			}

			const expectedQuiz = await findAllRelationQuiz(res.shortQuiz.id);
			expect(expectedQuiz).toBeDefined();
			expect(res.shortQuiz).toEqual(new ShowQuiz(expectedQuiz!));

			const { artist: artistName, tag: tagName, style: styleName } = res.context;

			expect(
				isNotFalsy(artistName) || isNotFalsy(tagName) || isNotFalsy(styleName),
			).toBeTruthy();
			if (artistName) {
				expect(expectedQuiz!.artists.some((v) => v.name === artistName)).toBe(true);
			}

			if (tagName) {
				expect(expectedQuiz!.tags.some((v) => v.name === tagName)).toBe(true);
			}

			if (styleName) {
				expect(expectedQuiz!.styles.some((v) => v.name === styleName)).toBe(true);
			}
		}

		const stubSize = 3;
		const tagStubs = Array(stubSize)
			.fill(0)
			.map(() => factoryTagStub());
		const styleStubs = Array(stubSize)
			.fill(0)
			.map(() => factoryStyleStub());
		const artistStubs = Array(stubSize)
			.fill(0)
			.map(() => factoryArtistStub());

		beforeAll(async () => {
			const [artists, styles, tags] = await Promise.all([
				testService.insertArtistStubs(artistStubs),
				testService.insertStyleStubs(styleStubs),
				testService.insertTagStubs(tagStubs),
			]);

			const paintingCount = 50;
			const [paintings, owners] = await Promise.all([
				testService.seedPaintings(paintingCount, {
					artists,
					styles,
					tags,
				}),
				testService.seedUsersSingleInsert(10),
			]);

			const quizCount = 50;
			await testService.seedOneChoiceQuizzes(quizCount, {
				owners: owners as [User, ...User[]],
				paintings: paintings as [Painting, Painting, Painting, Painting, ...Painting[]],
			});

			// initialize quizSchedule context
			const initQuizContext = Array(stubSize)
				.fill(0)
				.map((v, idx) => ({
					artist: artistStubs[idx].name,
					style: styleStubs[idx].name,
					tag: tagStubs[idx].name,
					page: 0,
				}));

			await quizScheduleService.initialize(initQuizContext);
		});
		describe("success when deliver valid query(minimal, maximal, custom)", () => {
			//TODO
			//-[x] empty query
			//-[x] 필드가 1개인 query
			//-[x] 필드가 여러개인 query

			describe.each([
				{
					testName: "deliver empty object",
					query: {},
				},
				{
					testName: "deliver artist, style and tag",
					query: {
						context: {
							artist: artistStubs[0].name,
							style: styleStubs[0].name,
							tag: tagStubs[0].name,
							page: 0,
						},
						currentIndex: 0,
						endIndex: 1,
					},
				},
				{
					testName: "deliver artist",
					query: {
						context: {
							artist: getRandomElement(artistStubs)!.name,
							page: 0,
						},
						currentIndex: 0,
						endIndex: 1,
					},
				},
				{
					testName: "deliver style",
					query: {
						context: {
							style: getRandomElement(styleStubs)!.name,
							page: 0,
						},
						currentIndex: 0,
						endIndex: 1,
					},
				},
				{
					testName: "deliver tag",
					query: {
						context: {
							tag: getRandomElement(tagStubs)!.name,
							page: 0,
						},
						currentIndex: 0,
						endIndex: 1,
					},
				},
			])("test : $testName ", ({ query }) => {
				let receivedRes: Awaited<ReturnType<typeof requestReadScheduleQuiz>>;

				beforeAll(async () => {
					receivedRes = await requestReadScheduleQuiz(query);
				});

				it("response data should match openapi doc", () => {
					expect(receivedRes.response.status).toBe(HttpStatus.OK);
					const body = receivedRes.data!;
					expectResponseBody(zScheduleQuizResponse, body);
				});

				it("scheduled quiz should contain context", async () => {
					await expectScheduleQuiz(query, receivedRes.data!);
				});
			});
		});

		describe("should get sequentially different quiz when repeat same query ", () => {
			const queries: ScheduleQuizQuery[] = [];
			let prevReceivedRes: Awaited<ReturnType<typeof requestReadScheduleQuiz>>;
			beforeAll(async () => {
				//request delete reaction
				const initResponse = await requestReadScheduleQuiz({});
				prevReceivedRes = initResponse;
				const query = pick(initResponse.data!, ["context", "currentIndex", "endIndex"]);
				queries.push(
					...Array(10)
						.fill(0)
						.map(() => query),
				);
			});

			it("response data should match openapi doc", () => {
				expect(prevReceivedRes.response.status).toBe(HttpStatus.OK);
				const body = prevReceivedRes.data!;
				expectResponseBody(zScheduleQuizResponse, body);
			});

			it("success when deliver previous request", async () => {
				for (const query of queries) {
					const receivedRes = await requestReadScheduleQuiz(query);
					expect(receivedRes.response.status).toBe(HttpStatus.OK);
					const body = receivedRes.data!;
					expectResponseBody(zScheduleQuizResponse, body);

					//"sequential quiz should be not equal",
					const prevQuizId = prevReceivedRes.data?.shortQuiz.id;
					const currentQuizId = receivedRes.data?.shortQuiz.id;
					expect(currentQuizId === prevQuizId).toBe(false);
				}
			});
		});

		//TODO 특수 상황 테스트 케이스
		//- [x] endIndex === currentIndex 인 경우 처리 결과
		//- [x] endIndex < currentIndex 인 경우 처리 결과
		describe("success when deliver special case query", () => {
			describe.each([
				{
					testName: "deliver 0 page",
					specialQuery: {
						context: {
							artist: artistStubs[0].name,
							page: 0,
						},
						currentIndex: 0,
						endIndex: 1,
					},
				},
				{
					testName: "deliver currentIndex bigger than endIndex",
					specialQuery: {
						context: {
							artist: artistStubs[0].name,
							page: 0, //
						},
						currentIndex: 100,
						endIndex: 10,
					},
				},
				{
					testName: "deliver currentIndex equal to endIndex",
					specialQuery: {
						context: {
							tag: tagStubs.reverse()[0].name,
							page: 0,
						},
						currentIndex: 100,
						endIndex: 100,
					},
				},
				{
					testName: "deliver without context and currentIndex equal to endIndex",
					specialQuery: {
						currentIndex: 100,
						endIndex: 100,
					},
				},
				{
					testName: "deliver query medium page ",
					specialQuery: {
						context: {
							style: styleStubs.reverse()[0].name,
							artist: artistStubs.reverse()[0].name,
							page: 10,
						},
						currentIndex: 0,
						endIndex: 10,
					},
				},
			])("test : $testName", ({ specialQuery }) => {
				let receivedRes: Awaited<ReturnType<typeof requestReadScheduleQuiz>>;
				beforeAll(async () => {
					const response = await requestReadScheduleQuiz(specialQuery);
					receivedRes = response;
				});

				it("response data should match openapi doc", () => {
					expect(receivedRes.response.status).toBe(HttpStatus.OK);
					const body = receivedRes.data!;
					expectResponseBody(zScheduleQuizResponse, body);
				});

				it("scheduled quiz should contain context", async () => {
					await expectScheduleQuiz(specialQuery, receivedRes.data!);
				});
			});
		});

		describe.skip("success when deliver special case query( difficult to test)", () => {
			describe.each([
				{
					testName: "deliver big page",
					specialQuery: {
						context: {
							style: styleStubs.reverse()[0].name,
							artist: artistStubs.reverse()[0].name,
							page: 100,
						},
						currentIndex: 0,
						endIndex: 10,
					},
				},
			])("test : $testName", ({ specialQuery }) => {
				let receivedRes: Awaited<ReturnType<typeof requestReadScheduleQuiz>>;
				beforeAll(async () => {
					const response = await requestReadScheduleQuiz(specialQuery);
					receivedRes = response;
				});

				it("response data should match openapi doc", () => {
					expect(receivedRes.response.status).toBe(HttpStatus.OK);
					const body = receivedRes.data!;
					expectResponseBody(zScheduleQuizResponse, body);
				});

				// it("scheduled quiz should contain context", async () => {
				// 	await expectScheduleQuiz(specialQuery, receivedRes.data!);
				// });
			});
		});

		//TODO 비유효 query 테스트 케이스 구현
		//- [x] 정의되지 않은 필드 데이터
		//- [x] context (artist,style,tag) 누락 데이터
		//- [x] page 음수 데이터
		//- [x] currentIndex 음수 데이터
		//- [x] endIndex 음수 데이터
		describe("fail when deliver invalid query", () => {
			describe.each([
				{
					testName: "deliver query containing not allowed field",
					invalidQuery: {
						invalid: "it is invalid",
					},
				},
				{
					testName: "deliver context containing only page",
					invalidQuery: {
						context: {
							page: 0,
						},
						currentIndex: 0,
						endIndex: 1,
					},
				},
				{
					testName: "deliver not existed artist",
					invalidQuery: {
						context: {
							artist: faker.string.uuid(),
							page: 0,
						},
						currentIndex: 0,
						endIndex: 1,
					},
				},
				{
					testName: "deliver negative currentIndex",
					invalidQuery: {
						context: {
							artist: artistStubs[0].name,
							page: 0,
						},
						currentIndex: -1,
						endIndex: 1,
					},
				},
				{
					testName: "deliver not exist artist",
					invalidQuery: {
						context: {
							artist: faker.internet.ipv6(),
							page: 0,
						},
						currentIndex: 0,
						endIndex: 10,
					},
				},
				{
					testName: "deliver not exist tag and artist",
					invalidQuery: {
						context: {
							style: faker.internet.ipv6(),
							artist: faker.string.uuid(),
							page: 0,
						},
						currentIndex: 0,
						endIndex: 10,
					},
				},
				{
					testName: "deliver not exist tag",
					invalidQuery: {
						context: {
							tag: faker.internet.ipv6(),
							page: 0,
						},
						currentIndex: 0,
						endIndex: 1,
					},
				},
			])("test : $testName", ({ invalidQuery }) => {
				let receivedRes: Awaited<ReturnType<typeof requestReadScheduleQuiz>>;
				beforeAll(async () => {
					const response = await requestReadScheduleQuiz(
						invalidQuery as ScheduleQuizQuery,
					);
					receivedRes = response;
				});

				it("response data should match openapi doc", () => {
					expect(receivedRes.response.status).toBe(HttpStatus.BAD_REQUEST);
				});
			});
		});
	});

	//TODO quiz schedule API 스펙 분석한뒤 진행하기
	describe("/quiz/schedule (POST)", () => {
		// TODO: "/quiz/schedule (POST)" e2e 테스트 구현
		// - [x] 공통 로직 구현
		// - [x] 시나리오별 공통 테스트 환경
		// - [x] 좋은 데이터 테스트 (최소한의 query,dto body)
		// - [x] 좋은 데이터 테스트 (최대한의 query, dto body)
		// - [x] 나쁜 데이터 테스트 (비유효 query, dto body)

		async function requestCreateSchedule(dto: QuizContextDto) {
			const response = await client.POST(ApiPaths.QuizController_addQuizContext, {
				body: dto,
			});

			return response;
		}

		const stubSize = 3;
		const tagStubs = Array(stubSize)
			.fill(0)
			.map(() => factoryTagStub());
		const styleStubs = Array(stubSize)
			.fill(0)
			.map(() => factoryStyleStub());
		const artistStubs = Array(stubSize)
			.fill(0)
			.map(() => factoryArtistStub());

		beforeAll(async () => {
			const [artists, styles, tags] = await Promise.all([
				testService.insertArtistStubs(artistStubs),
				testService.insertStyleStubs(styleStubs),
				testService.insertTagStubs(tagStubs),
			]);

			const paintingCount = 50;
			const [paintings, owners] = await Promise.all([
				testService.seedPaintings(paintingCount, {
					artists,
					styles,
					tags,
				}),
				testService.seedUsersSingleInsert(10),
			]);

			const quizCount = 50;
			await testService.seedOneChoiceQuizzes(quizCount, {
				owners: owners as [User, ...User[]],
				paintings: paintings as [Painting, Painting, Painting, Painting, ...Painting[]],
			});

			// initialize quizSchedule context
			const initQuizContext = Array(stubSize)
				.fill(0)
				.map((v, idx) => ({
					artist: artistStubs[idx].name,
					style: styleStubs[idx].name,
					tag: tagStubs[idx].name,
					page: 0,
				}));

			await quizScheduleService.initialize(initQuizContext);
		});

		describe("success when deliver dto (minimal, fully)", () => {
			describe.each([
				{
					testName: "deliver tag, artist, style and page",
					dto: {
						tag: tagStubs[0].name,
						artist: artistStubs[0].name,
						style: styleStubs[0].name,
						page: 0,
					},
				},
				{
					testName: "deliver tag and page",
					dto: {
						tag: tagStubs[0].name,
						page: 0,
					},
				},
				{
					testName: "deliver artist and page",
					dto: {
						artist: artistStubs[0].name,
						page: 0,
					},
				},
				{
					testName: "deliver style and page",
					dto: {
						style: styleStubs[0].name,
						page: 0,
					},
				},
				{
					testName: "deliver big page",
					dto: {
						tag: tagStubs[0].name,
						artist: artistStubs[0].name,
						style: styleStubs[0].name,
						page: 100,
					},
				},
			])("test : $testName", ({ dto }) => {
				let receivedRes: Awaited<ReturnType<typeof requestCreateSchedule>>;
				beforeAll(async () => {
					receivedRes = await requestCreateSchedule(dto);
				});

				it("response data should match openapi doc", () => {
					expect(receivedRes.response.status).toBe(HttpStatus.CREATED);
				});
			});
		});

		describe("fail when deliver invalid dto ", () => {
			describe.each([
				{
					testName: "deliver not exist tag name",
					dto: {
						tag: faker.string.uuid(),
						page: 0,
					},
				},
				{
					testName: "deliver not exist style name",
					dto: {
						style: faker.string.uuid(),
						page: 0,
					},
				},
				{
					testName: "deliver not exist artist name",
					dto: {
						artist: faker.string.uuid(),
						page: 0,
					},
				},
				{
					testName: "deliver not exist dto field",
					dto: {
						invalid: "invalid",
						page: 0,
					},
				},
				{
					testName: "deliver empty object dto",
					dto: {},
				},
				{
					testName: "deliver negative page",
					dto: {
						artist: artistStubs[0].name,
						page: -1,
					},
				},
			])("test : $testName", ({ dto }) => {
				let receivedRes: Awaited<ReturnType<typeof requestCreateSchedule>>;
				beforeAll(async () => {
					receivedRes = await requestCreateSchedule(dto as QuizContextDto);
				});

				it("response data should match openapi doc", () => {
					expect(receivedRes.response.status).toBe(HttpStatus.BAD_REQUEST);
				});
			});
		});
	});

	describe("/quiz (POST)", () => {
		// TODO: "/quiz (POST)" e2e 테스트 구현
		// - [x] 공통 로직 구현
		// - [x] 좋은 데이터 테스트 (최소한의 query,dto body)
		// - [x] 좋은 데이터 테스트 (최대한의 query, dto body)
		// - [x] 나쁜 데이터 테스트 (비유효 query, dto body)
		// - [x] 나쁜 데이터 테스트 (비권한 authorization header )

		async function requestCreateQuiz(dto: CreateQuizDto, bearerAuth: string) {
			const response = await client.POST(ApiPaths.QuizController_create, {
				params: {
					header: {
						authorization: bearerAuth,
					},
				},
				body: dto,
			});

			return response;
		}

		type StringLeast3 = [string, string, string];
		function factoryCreateQuizDto(
			answerPaintingId: string,
			distractorPaintingIds: StringLeast3,
		): CreateQuizDto {
			const { time_limit: timeLimit, description, title } = factoryQuizStub();
			const dto: CreateQuizDto = {
				type: QUIZ_TYPE.ONE_CHOICE,
				answerPaintingIds: [answerPaintingId],
				distractorPaintingIds: distractorPaintingIds,
				title,
				timeLimit,
				description,
			};

			return dto;
		}

		const paintingStubs = Array(50)
			.fill(0)
			.map(() => factoryPaintingStub());
		const deletedPaintingStub = factoryPaintingStub();

		beforeAll(async () => {
			const count = 20;
			const [artists, styles, tags] = await Promise.all([
				testService.seedArtists(count),
				testService.seedStyles(count),
				testService.seedTags(count),
			]);

			await testService.insertPaintingStubs(
				paintingStubs
					.map((stub) => ({
						paintingDummy: stub,
						tags: selectRandomElements(tags, 2),
						styles: selectRandomElements(styles, 2),
						artist: getRandomElement(artists)!,
					}))
					.concat({
						paintingDummy: deletedPaintingStub,
						tags: selectRandomElements(tags, 2),
						styles: selectRandomElements(styles, 2),
						artist: getRandomElement(artists)!,
					}),
			);

			const deletedPainting = await paintingService.findOne({
				where: { id: deletedPaintingStub.id },
			});
			assert(deletedPainting);
			const qr = dbService.getQueryRunner();
			await paintingService.deleteOne(qr, deletedPainting!);
			await qr.release();
		});

		describe.each([
			{
				userType: USER_ROLE.USER,
			},
			{
				userType: USER_ROLE.ADMIN,
			},
		])("success when deliver valid dto by user($userType)", ({ userType }) => {
			describe.each([
				{
					testName: "deliver ONE_CHOICE type",
					dto: {
						type: QUIZ_TYPE.ONE_CHOICE,
						answerPaintingIds: [paintingStubs[0].id],
						distractorPaintingIds: paintingStubs.slice(1, 4).map((stub) => stub.id),
						title: "quiz create",
						timeLimit: 10,
						description: "anything what you can",
					},
				},
				{
					testName: "deliver MULTIPLE_CHOICE type",
					dto: {
						type: QUIZ_TYPE.MULTIPLE_CHOICE,
						answerPaintingIds: [paintingStubs[10].id],
						distractorPaintingIds: paintingStubs.slice(0, 3).map((stub) => stub.id),
						title: faker.person.fullName(),
						timeLimit: 20,
						description: faker.commerce.productDescription(),
					},
				},
			])("test : $testName", ({ dto }) => {
				let receivedRes: Awaited<ReturnType<typeof requestCreateQuiz>>;

				let expectedQuizPart: ExpectedQuizPart;
				let receivedQuiz: Quiz | null;

				beforeAll(async () => {
					const creator = await testService.insertStubUser(factoryUserStub(userType));

					const answer = await paintingService.findOne({
						where: { id: dto.answerPaintingIds[0] },
					});
					const distractors = await paintingService.getManyByIds(
						dto.distractorPaintingIds,
					);

					assert(answer);
					assert(distractors.length === dto.distractorPaintingIds.length);

					expectedQuizPart = {
						answer_paintings: [answer!],
						distractor_paintings: distractors,
						description: dto.description,
						time_limit: dto.timeLimit,
						title: dto.title,
						owner: creator,
					};
					const bearerAuth = testService.getBearerAuthCredential(creator);
					receivedRes = await requestCreateQuiz(dto, bearerAuth);
					receivedQuiz = await findAllRelationQuiz(receivedRes.data!.id);
				});

				it("response should follow openapi doc", () => {
					expect(receivedRes.response.status).toBe(HttpStatus.CREATED);
					expectResponseBody(zShowQuizResponse, receivedRes.data);
				});

				it("quiz should be created and to be expected", () => {
					expect(receivedQuiz).toBeDefined();
					expect(receivedRes.data).toEqual(new ShowQuizResponse(receivedQuiz!));
					expectQuizEqual(receivedQuiz!, expectedQuizPart);
				});
			});
		});

		describe("fail when invalid auth", () => {
			let receivedRes: Awaited<ReturnType<typeof requestCreateQuiz>>;
			let receivedQuiz: Quiz | null;
			describe.each([
				{
					testName: "deliver invalid jwt",
					invalidBearToken: faker.internet.jwt(),
				},
			])("test : %testName", ({ invalidBearToken }) => {
				beforeAll(async () => {
					const dto = factoryCreateQuizDto(
						paintingStubs[0].id,
						paintingStubs.slice(1, 4).map((d) => d.id) as StringLeast3,
					);

					receivedRes = await requestCreateQuiz(dto, `Bearer ${invalidBearToken}`);
					receivedQuiz = await findAllRelationQuiz(receivedRes.data!.id);
				});

				it("response should follow openapi doc", () => {
					expect(receivedRes.response.status).toBe(HttpStatus.FORBIDDEN);
				});

				it("quiz should not created", () => {
					expect(receivedQuiz).toBeNull();
				});
			});
		});

		describe.each([
			{
				userType: USER_ROLE.USER,
			},
			{
				userType: USER_ROLE.ADMIN,
			},
		])("fail when invalid referring wrong painting", ({ userType }) => {
			//TODO 비유효 body dto 테스트 케이스 구현
			//- [x] 잘못된 painting ID 데이터
			//- [x] 중복된 painting ID 데이터
			//- [x] 비유효 type 데이터
			//- [x] 음수 timeLimit
			//- [x] 삭제된 Painting ID 참조

			describe.each([
				{
					testName: "deliver not existed painting id as answerPaintingIds field ",
					inValidDto: {
						type: QUIZ_TYPE.ONE_CHOICE,
						answerPaintingIds: [faker.string.uuid()],
						distractorPaintingIds: paintingStubs.slice(1, 4).map((stub) => stub.id),
						title: "quiz create",
						timeLimit: 10,
						description: "anything what you can",
					},
				},
				{
					testName: "deliver invalid  type ",
					inValidDto: {
						type: "invalid_enum",
						answerPaintingIds: [paintingStubs[10].id],
						distractorPaintingIds: paintingStubs.slice(0, 3).map((stub) => stub.id),
						title: faker.person.fullName(),
						timeLimit: 20,
						description: faker.commerce.productDescription(),
					},
				},
				{
					testName: "deliver duplicated paintingId ",
					inValidDto: {
						type: QUIZ_TYPE.ONE_CHOICE,
						answerPaintingIds: [paintingStubs[10].id],
						distractorPaintingIds: paintingStubs.slice(10, 13).map((stub) => stub.id), //
						title: faker.person.fullName(),
						timeLimit: 20,
						description: faker.commerce.productDescription(),
					},
				},
				{
					testName: "deliver negative timeLimit ",
					inValidDto: {
						type: QUIZ_TYPE.ONE_CHOICE,
						answerPaintingIds: [paintingStubs[10].id],
						distractorPaintingIds: paintingStubs.slice(10, 13).map((stub) => stub.id),
						title: faker.person.fullName(),
						timeLimit: -1, //
						description: faker.commerce.productDescription(),
					},
				},
				{
					testName: "deliver undefined description ",
					inValidDto: {
						type: QUIZ_TYPE.ONE_CHOICE,
						answerPaintingIds: [faker.string.uuid()],
						distractorPaintingIds: paintingStubs.slice(1, 4).map((stub) => stub.id),
						title: "quiz create",
						timeLimit: 10,
						description: undefined,
					},
				},
				{
					testName:
						"deliver undefined answerPaintingIds , distractorPaintingIds and description ",
					inValidDto: {
						type: QUIZ_TYPE.ONE_CHOICE,
						answerPaintingIds: undefined,
						distractorPaintingIds: undefined,
						title: "quiz create",
						timeLimit: 10,
						description: undefined,
					},
				},
				{
					testName: "deliver null answerPaintingIds field",
					inValidDto: {
						type: QUIZ_TYPE.ONE_CHOICE,
						answerPaintingIds: null,
						distractorPaintingIds: paintingStubs.slice(1, 4).map((stub) => stub.id),
						title: "quiz create",
						timeLimit: 10,
						description: faker.commerce.productDescription(),
					},
				},
				{
					testName: "deliver deleted Painting id as answerPaintingIds field",
					inValidDto: {
						type: QUIZ_TYPE.ONE_CHOICE,
						answerPaintingIds: deletedPaintingStub.id,
						distractorPaintingIds: paintingStubs.slice(1, 4).map((stub) => stub.id),
						title: "quiz create",
						timeLimit: 10,
						description: faker.commerce.productDescription(),
					},
				},
				{
					testName: "deliver deleted Painting id as distractorPaintingIds field",
					inValidDto: {
						type: QUIZ_TYPE.ONE_CHOICE,
						answerPaintingIds: [paintingStubs[0].id],
						distractorPaintingIds: paintingStubs
							.slice(1, 3)
							.map((stub) => stub.id)
							.concat(deletedPaintingStub.id),
						title: "quiz create",
						timeLimit: 10,
						description: faker.commerce.productDescription(),
					},
				},
				{
					testName: "deliver too much distractorPaintingIds ",
					inValidDto: {
						type: QUIZ_TYPE.ONE_CHOICE,
						answerPaintingIds: [paintingStubs[0].id],
						distractorPaintingIds: paintingStubs
							.slice(1, 10)
							.map((stub) => stub.id)
							.concat(deletedPaintingStub.id),
						title: "quiz create",
						timeLimit: 10,
						description: faker.commerce.productDescription(),
					},
				},
			])("test : $testName", ({ inValidDto }) => {
				let receivedRes: Awaited<ReturnType<typeof requestCreateQuiz>>;

				beforeAll(async () => {
					const creator = await testService.insertStubUser(factoryUserStub(userType));

					const bearerAuth = testService.getBearerAuthCredential(creator);
					receivedRes = await requestCreateQuiz(inValidDto as CreateQuizDto, bearerAuth);
				});

				it("response should follow openapi doc", () => {
					expect(receivedRes.response.status).toBe(HttpStatus.BAD_REQUEST);
				});
			});
		});
	});

	describe("/quiz (GET)", () => {
		// TODO: "/quiz (GET)" e2e 테스트 구현
		// - [x] 공통 로직 구현
		// - [x] 좋은 데이터 테스트 (최소한의 query,dto body)
		// - [x] 좋은 데이터 테스트 (최대한의 query, dto body)
		// - [x] 나쁜 데이터 테스트 (비유효 query, dto body)
		async function requestSearchQuiz(query?: {
			artists?: string[];
			tags?: string[];
			styles?: string[];
			page?: number;
			count?: number;
		}) {
			const response = await client.GET(ApiPaths.QuizController_searchQuiz, {
				params: {
					query,
				},
			});

			return response;
		}

		type PaginationShowQuiz = {
			data: ShowQuiz[];
			count: number;
			page: number;
			total: number;
			pageCount: number;
		};

		type SearchQuizQuery = {
			tags?: string[];
			artists?: string[];
			styles?: string[];
			page?: number;
		};

		async function expectSearchQuiz(query: SearchQuizQuery, receivedData: PaginationShowQuiz) {
			assert(receivedData.data.length !== 0);
			const quizzes = await Promise.all(
				receivedData.data.map((info) => findAllRelationQuiz(info.id)),
			);

			for (const quiz of quizzes) {
				expect(quiz).toBeDefined();
				const { tags, artists, styles } = quiz!;
				const receivedTagNames = sortByAlphabet(tags.map((t) => t.name));
				const expectedTagNames = isNotFalsy(query.tags) ? sortByAlphabet(query.tags) : [];
				expect(receivedTagNames).toMatchObject(expectedTagNames);

				const receivedArtistNames = sortByAlphabet(artists.map((a) => a.name));
				const expectedArtistNames = isNotFalsy(query.artists)
					? sortByAlphabet(query.artists)
					: [];
				expect(receivedArtistNames).toMatchObject(expectedArtistNames);

				const receivedStyleNames = sortByAlphabet(styles.map((s) => s.name));
				const expectedStyleNames = isNotFalsy(query.styles)
					? sortByAlphabet(query.styles)
					: [];
				expect(receivedStyleNames).toMatchObject(expectedStyleNames);
			}
		}

		function sortByAlphabet(arr: string[]) {
			return arr.sort((str1, str2) => str1.localeCompare(str2));
		}
		const stubSize = 3;
		const tagStubs = Array(stubSize)
			.fill(0)
			.map(() => factoryTagStub());
		const styleStubs = Array(stubSize)
			.fill(0)
			.map(() => factoryStyleStub());
		const artistStubs = Array(stubSize)
			.fill(0)
			.map(() => factoryArtistStub());

		beforeAll(async () => {
			const [artists, styles, tags] = await Promise.all([
				testService.insertArtistStubs(artistStubs),
				testService.insertStyleStubs(styleStubs),
				testService.insertTagStubs(tagStubs),
			]);

			const paintingCount = 50;
			const [paintings, owners] = await Promise.all([
				testService.seedPaintings(paintingCount, {
					artists,
					styles,
					tags,
				}),
				testService.seedUsersSingleInsert(10),
			]);

			const quizCount = 80;
			await testService.seedOneChoiceQuizzes(quizCount, {
				owners: owners as [User, ...User[]],
				paintings: paintings as [Painting, Painting, Painting, Painting, ...Painting[]],
			});

			// initialize quizSchedule context
			const initQuizContext = Array(stubSize)
				.fill(0)
				.map((v, idx) => ({
					artist: artistStubs[idx].name,
					style: styleStubs[idx].name,
					tag: tagStubs[idx].name,
					page: 0,
				}));

			await quizScheduleService.initialize(initQuizContext);
		});

		describe("success when deliver valid query", () => {
			describe.each([
				{ testName: "deliver empty object query", query: {} },
				{
					testName: "deliver one artist name",
					query: {
						artists: artistStubs.slice(0, 1).map((v) => v.name),
					},
				},
				{
					testName: "deliver two artist name",
					query: {
						artists: artistStubs.slice(0, 2).map((v) => v.name),
					},
				},
				{
					testName: "deliver 1 artist name and page ",
					query: {
						artists: artistStubs.slice(0, 1).map((v) => v.name),
						page: 1,
					},
				},
				{
					testName: "deliver one tag name ",
					query: {
						tags: tagStubs.slice(0, 1).map((v) => v.name),
					},
				},
				{
					testName: "deliver two tag names",
					query: {
						tags: tagStubs.slice(0, 2).map((v) => v.name),
					},
				},
				{
					testName: "deliver one style name",
					query: {
						styles: styleStubs.slice(0, 1).map((v) => v.name),
					},
				},
				{
					testName: "deliver two style names",
					query: {
						styles: styleStubs.slice(0, 2).map((v) => v.name),
					},
				},
				{
					testName: "deliver artist and style name",
					query: {
						artist: artistStubs.slice(0, 1).map((v) => v.name),
						styles: styleStubs.slice(0, 1).map((v) => v.name),
					},
				},
			])("test : $testName", ({ query }) => {
				let receivedRes: Awaited<ReturnType<typeof requestSearchQuiz>>;
				beforeAll(async () => {
					receivedRes = await requestSearchQuiz(query);
				});

				it("response should match openapi doc", () => {
					expect(receivedRes.response.status).toBe(HttpStatus.OK);
					expectResponseBody(zPagination(zShowQuiz), receivedRes.data);
				});
				it("response data should be expected", async () => {
					assert(receivedRes.data !== undefined);
					await expectSearchQuiz(query, receivedRes.data as PaginationShowQuiz);
				});
			});
		});

		describe("success when deliver query containing meaningless data", () => {
			//TODO 의미없는 Query 사용한 검색 테스트 구현
			//- [x] 미존재 artist 이름 데이터
			//- [x] 미존재 tag 이름 데이터
			//- [x] 미존재 style 이름 데이터
			//- [x] 매우큰 page 데이터
			//- [ ] 공백 데이터
			describe.each([
				{
					testName: "deliver not exist artist name",
					query: {
						artists: [faker.string.uuid()],
					},
				},
				{
					testName: "deliver not exist tag name",
					query: {
						tags: [faker.string.uuid()],
					},
				},
				{
					testName: "deliver not exist styles name",
					query: {
						styles: [faker.string.uuid()],
					},
				},
				{
					testName: "deliver big page",
					query: {
						artists: artistStubs.slice(0, 1).map((v) => v.name),
						styles: styleStubs.slice(0, 1).map((v) => v.name),
						page: 100,
					},
				},
				{
					testName: "deliver big page and not existed tag",
					query: {
						artists: artistStubs.slice(0, 1).map((v) => v.name),
						styles: styleStubs.slice(0, 1).map((v) => v.name),
						tags: [faker.string.uuid()],
						page: 100,
					},
				},
				{
					testName: "deliver empty array",
					query: {
						styles: [""],
					},
				},
			])("test : $testName", ({ query }) => {
				let receivedRes: Awaited<ReturnType<typeof requestSearchQuiz>>;
				beforeAll(async () => {
					receivedRes = await requestSearchQuiz(query);
				});

				it("response should match openapi doc", () => {
					expect(receivedRes.response.status).toBe(HttpStatus.OK);
					expectResponseBody(zPagination(zShowQuiz), receivedRes.data);
				});
				it("search result should empty", () => {
					expect(receivedRes.data!.data).toEqual([]);
				});
			});
		});
		describe("fail when deliver invalid query", () => {
			//TODO 미유효 Query 테스트 구현
			//- [x] : page가 음수인 데이터
			//- [x] : 정의되지 않은 필드를 포함하는 데이터
			describe.each([
				{
					testName: "page is negative",
					invalidQuery: {
						page: -1,
					},
				},
				{
					testName: "deliver not existed field",
					invalidQuery: {
						notExistField: -1,
					},
				},
			])("test : $testName", ({ invalidQuery }) => {
				let receivedRes: Awaited<ReturnType<typeof requestSearchQuiz>>;
				beforeAll(async () => {
					receivedRes = await requestSearchQuiz(invalidQuery as SearchQuizQuery);
				});

				it("response should match openapi doc", () => {
					expect(receivedRes.response.status).toBe(HttpStatus.BAD_REQUEST);
				});
			});
		});
	});

	describe("/quiz/:id (GET)", () => {
		// TODO: "/quiz/:id (GET)" e2e 테스트 구현
		// - [x] 공통 로직 구현
		// - [x] 좋은 데이터 테스트 (최소한의 query,dto body)
		// - [x] 좋은 데이터 테스트 (최대한의 query, dto body)
		// - [x] 나쁜 데이터 테스트 (비유효 query, dto body)
		// - [x] 나쁜 데이터 테스트 (비권한 authorization header )
		// - [ ] 경계 분석 테스트

		async function requestReadQuiz(
			id: string,
			query?: { isS3Access?: boolean; userId?: string },
		) {
			const response = await client.GET(ApiPaths.QuizController_getDetailQuiz, {
				params: {
					path: { id },
					query,
				},
			});

			return response;
		}
		describe.each([
			{
				userType: USER_ROLE.USER,
			},
			{
				userType: USER_ROLE.ADMIN,
			},
		])("success quiz when deliver id path and query", ({ userType }) => {
			const quizStub = factoryQuizStub();
			const userStub = factoryUserStub(userType);

			beforeAll(async () => {
				const owner = (await testService.seedUsersSingleInsert(1))[0];
				const [answer, ...distractors] = await testService.seedPaintings(4);

				await testService.insertOneChoiceQuizStubs([
					{
						answer,
						owner,
						quizStub,
						distractors: distractors as [Painting, Painting, Painting],
					},
				]);

				await testService.insertStubUser(userStub);
			});

			describe.each([
				{
					id: quizStub.id,
				},
				{
					id: quizStub.id,
					query: {
						userId: userStub.id,
						isS3Access: false,
					},
				},
				{
					id: quizStub.id,
					query: {
						userId: userStub.id,
						isS3Access: false,
					},
				},
				{
					id: quizStub.id,
					query: {
						isS3Access: false,
					},
				},
			])("input : %o", ({ id, query }) => {
				let receivedRes: Awaited<ReturnType<typeof requestReadQuiz>>;
				let expectedQuiz: Quiz;

				beforeAll(async () => {
					expectedQuiz = (await findAllRelationQuiz(id))!;
					assert(expectedQuiz !== null);

					receivedRes = await requestReadQuiz(id, query);
				});
				it("response should match openapi doc", () => {
					expect(receivedRes.response.status).toBe(HttpStatus.OK);
					expectResponseBody(zDetailQuizResponse, receivedRes.data);
				});

				it("received quiz should be expected", () => {
					const expectedQuizResponse = new ShowQuizResponse(expectedQuiz);
					expect(receivedRes.data?.quiz).toEqual(
						omit(expectedQuizResponse, ["example_painting"]),
					);
				});
			});
		});

		describe.each([
			{
				userType: USER_ROLE.USER,
			},
			{
				userType: USER_ROLE.ADMIN,
			},
		])(
			"success when deliver userId in query and user create reaction by user($userType)",
			({ userType }) => {
				const quizStub = factoryQuizStub();
				const userStub = factoryUserStub(userType);
				let expectedQuiz: Quiz;
				let testUser: User;

				beforeAll(async () => {
					const owner = (await testService.seedUsersSingleInsert(1))[0];
					const [answer, ...distractors] = await testService.seedPaintings(4);

					expectedQuiz = (
						await testService.insertOneChoiceQuizStubs([
							{
								answer,
								owner,
								quizStub,
								distractors: distractors as [Painting, Painting, Painting],
							},
						])
					)[0];

					testUser = await testService.insertStubUser(userStub);
				});
				describe.each([
					{
						id: quizStub.id,
						query: {
							userId: userStub.id,
						},
						reactionType: QUIZ_REACTION.dislike,
					},
					{
						id: quizStub.id,
						query: {
							userId: userStub.id,
						},
						reactionType: QUIZ_REACTION.like,
					},
				])("input : %o", ({ id, query, reactionType }) => {
					let receivedRes: Awaited<ReturnType<typeof requestReadQuiz>>;

					beforeAll(async () => {
						const qr = dbService.getQueryRunner();
						if (reactionType === QUIZ_REACTION.dislike) {
							await quizService.dislikeQuiz(qr, testUser, expectedQuiz);
						} else {
							await quizService.likeQuiz(qr, testUser, expectedQuiz);
						}
						await qr.release();

						receivedRes = await requestReadQuiz(id, query);
					});
					it("response should match openapi doc", () => {
						expect(receivedRes.response.status).toBe(HttpStatus.OK);
						expectResponseBody(zDetailQuizResponse, receivedRes.data);
					});

					it("received quiz should be expected", async () => {
						assert(receivedRes.data !== undefined);
						const expectedData = new DetailQuizResponse(
							expectedQuiz,
							await quizService.getQuizReactionCounts(expectedQuiz.id),
							reactionType,
						);
						//example_painting field is not used. so omit when expect quiz
						expect(receivedRes.data!.quiz).toEqual(
							omit(expectedData.quiz, ["example_painting"]),
						);
						expect(receivedRes.data!.reactionCount).toEqual(expectedData.reactionCount);
						expect(receivedRes.data!.userReaction).toEqual(expectedData.userReaction);
					});
				});
			},
		);
		describe.each([
			{
				userType: USER_ROLE.USER,
			},
			{
				userType: USER_ROLE.ADMIN,
			},
		])("success when special case", ({ userType }) => {
			// TODO 특수 상황 GET /quiz:id 테스트 구현
			//-[x] 삭제된 user id 데이터

			const quizStub = factoryQuizStub();
			const userStub = factoryUserStub(userType);
			let expectedQuiz: Quiz;
			const deletedUserStub = factoryUserStub(userType);

			beforeAll(async () => {
				const owner = (await testService.seedUsersSingleInsert(1))[0];
				const [answer, ...distractors] = await testService.seedPaintings(4);

				expectedQuiz = (
					await testService.insertOneChoiceQuizStubs([
						{
							answer,
							owner,
							quizStub,
							distractors: distractors as [Painting, Painting, Painting],
						},
					])
				)[0];

				await testService.insertStubUser(userStub);
				await testService.insertStubUser(deletedUserStub);
				const qr = dbService.getQueryRunner();
				await userService.softDeleteUser(qr, deletedUserStub.id);
				await qr.release();
			});

			describe.each([
				{
					id: quizStub.id,
					query: {
						userId: deletedUserStub.id,
					},
				},
				{
					id: quizStub.id,
					query: {
						userId: faker.string.uuid(),
					},
				},
				{
					id: quizStub.id,
					query: {
						userId: userStub.id,
						isS3Access: "this value is transformed to default",
					},
				},
			])("input : %o", ({ id, query }) => {
				let receivedRes: Awaited<ReturnType<typeof requestReadQuiz>>;

				beforeAll(async () => {
					receivedRes = await requestReadQuiz(
						id,
						query as { isS3Access?: boolean; userId?: string },
					);
				});
				it("response should match openapi doc", () => {
					expect(receivedRes.response.status).toBe(HttpStatus.OK);
					expectResponseBody(zDetailQuizResponse, receivedRes.data);
				});
				it("received quiz should be expected", () => {
					const expectedQuizResponse = new ShowQuizResponse(expectedQuiz);
					expect(receivedRes.data?.quiz).toEqual(
						omit(expectedQuizResponse, ["example_painting"]),
					);
				});
			});
		});

		describe.each([
			{
				userType: USER_ROLE.USER,
			},
			{
				userType: USER_ROLE.ADMIN,
			},
		])("fail when invalid id or query", ({ userType }) => {
			// TODO 미유효 id 또는 Query GET /quiz:id 테스트 구현
			//-[x] 미유효 id 데이터
			//-[x] 미유효 query 데이터
			//-[x] 삭제된 quiz id 데이터

			const quizStub = factoryQuizStub();
			const userStub = factoryUserStub(userType);
			const deletedQuizStub = factoryQuizStub();

			beforeAll(async () => {
				const owner = (await testService.seedUsersSingleInsert(1))[0];
				const [answer, ...distractors] = await testService.seedPaintings(4);

				await testService.insertOneChoiceQuizStubs([
					{
						answer,
						owner,
						quizStub,
						distractors: distractors as [Painting, Painting, Painting],
					},
					{
						answer,
						owner,
						quizStub: deletedQuizStub,
						distractors: distractors as [Painting, Painting, Painting],
					},
				]);

				await testService.insertStubUser(userStub);
				const qr = dbService.getQueryRunner();
				await quizService.softDeleteQuiz(qr, deletedQuizStub.id);
				await qr.release();
			});

			describe.each([
				{
					testName: "UUID이외의 형식인 id",
					invalidId: faker.internet.email(),
				},
				{
					testName: "존재하지 않는 quiz id",
					invalidId: faker.string.uuid(),
				},
				{
					testName: "삭제된 quiz id",
					invalidId: deletedQuizStub.id,
				},
				{
					testName: "UUID이외의 형식인 userId",
					invalidId: quizStub.id,
					inValidQuery: {
						userId: faker.person.firstName(),
					},
				},
			])("input : $testName", ({ invalidId, inValidQuery }) => {
				let receivedRes: Awaited<ReturnType<typeof requestReadQuiz>>;

				beforeAll(async () => {
					receivedRes = await requestReadQuiz(
						invalidId,
						inValidQuery as { isS3Access?: boolean; userId?: string },
					);
				});
				it("response should match openapi doc", () => {
					expect(receivedRes.response.status).toBe(HttpStatus.BAD_REQUEST);
					expect(receivedRes.data).toBeUndefined();
				});
			});
		});
	});

	describe("/quiz/:id (PUT)", () => {
		// TODO: "/quiz/:id (PUT)" e2e 테스트 구현
		// - [x] 공통 로직 구현
		// - [x] 좋은 데이터 테스트 (최소한의 query,dto body)
		// - [x] 좋은 데이터 테스트 (최대한의 query, dto body)
		// - [x] 나쁜 데이터 테스트 (비유효 query, dto body)
		// - [x] 나쁜 데이터 테스트 (비권한 authorization header )
		// - [ ] 경계 분석 테스트
		async function requestReplaceQuiz(id: string, dto: ReplaceQuizDto, bearerAuth: string) {
			const response = await client.PUT(ApiPaths.QuizController_update, {
				params: {
					path: { id },
					header: {
						authorization: bearerAuth,
					},
				},
				body: dto,
			});

			return response;
		}

		// type PaintingLeast3 = [Painting, Painting, Painting];
		// function factoryReplaceQuizDto(
		// 	answer: Painting,
		// 	distractor: PaintingLeast3,
		// ): ReplaceQuizDto {
		// 	const { time_limit: timeLimit, description, title } = factoryQuizStub();
		// 	const dto: CreateQuizDto = {
		// 		type: QUIZ_TYPE.ONE_CHOICE,
		// 		answerPaintingIds: [answer.id],
		// 		distractorPaintingIds: distractor.map((p) => p.id),
		// 		title,
		// 		timeLimit,
		// 		description,
		// 	};

		// 	return dto;
		// }

		const PAINTING_COUNT = { answer: 1, distractor: 3, optional: 4 };
		const paintingStubs = Array(
			PAINTING_COUNT.answer + PAINTING_COUNT.distractor + PAINTING_COUNT.optional,
		)
			.fill(0)
			.map(() => factoryPaintingStub());
		let paintings: Painting[];

		beforeAll(async () => {
			const PaintingSource = await testService.seedPaintings(paintingStubs.length);

			console.log("start at once before any description run");

			paintings = await testService.insertPaintingStubs(
				paintingStubs.map((stub, idx) => ({
					paintingDummy: stub,
					artist: PaintingSource[idx].artist,
					styles: PaintingSource[idx].styles,
					tags: PaintingSource[idx].tags,
				})),
			);
		});

		describe.each([
			{
				userType: USER_ROLE.USER,
			},
			{
				userType: USER_ROLE.ADMIN,
			},
		])("success when deliver valid dto by user($userType)", ({ userType }) => {
			// TODO 유효 body dto /quiz/:id (PUT) 테스트 구현
			//-[x] : title 데이터 수정
			//-[x] : description 데이터 수정
			//-[x] : answer 데이터 수정
			//-[x] : distractor 일부 수정
			//-[x] : distractor 전체 수정

			const quizStub = factoryQuizStub();
			const ownerStub = factoryUserStub(userType);
			let owner: User;

			beforeAll(async () => {
				owner = await testService.insertStubUser(ownerStub);

				const answer = paintings[PAINTING_COUNT.answer - 1];
				const distractors = paintings.slice(
					PAINTING_COUNT.answer,
					PAINTING_COUNT.answer + 3,
				) as [Painting, Painting, Painting];

				assert(distractors.length === 3);

				await testService.insertOneChoiceQuizStubs([
					{
						answer,
						owner,
						quizStub,
						distractors,
					},
				]);
			});

			describe.each([
				{
					testName: "title, timeLimit,description 수정",
					id: quizStub.id,
					dto: {
						answerPaintingIds: paintingStubs.slice(0, 1).map((p) => p.id),
						distractorPaintingIds: paintingStubs.slice(1, 4).map((p) => p.id),
						title: faker.book.title(),
						timeLimit: faker.number.int({ min: 0, max: 100 }),
						description: faker.commerce.productDescription(),
					},
				},
				{
					testName: "answerPaintingIds와 distractorPaintingIds수정",
					id: quizStub.id,
					dto: {
						answerPaintingIds: paintingStubs.slice(1, 2).map((p) => p.id),
						distractorPaintingIds: paintingStubs.slice(2, 5).map((p) => p.id),
						title: faker.book.title(),
						timeLimit: faker.number.int({ min: 0, max: 100 }),
						description: faker.commerce.productDescription(),
					},
				},
			])("test : $testName", ({ id, dto }) => {
				let receivedRes: Awaited<ReturnType<typeof requestReplaceQuiz>>;
				let expectedQuizPart: ExpectedQuizPart;
				let receivedQuiz: Quiz;

				beforeAll(async () => {
					const answer_painting = await paintingService.findOne({
						where: { id: dto.answerPaintingIds[0] },
					});
					const distractor_paintings = await paintingService.getManyByIds(
						dto.distractorPaintingIds,
					);
					assert(answer_painting !== null);

					expectedQuizPart = {
						description: dto.description,
						title: dto.title,
						time_limit: dto.timeLimit,
						owner: owner,
						answer_paintings: [answer_painting!],
						distractor_paintings: distractor_paintings,
					};

					const bearerAuth = testService.getBearerAuthCredential(owner);
					receivedRes = await requestReplaceQuiz(id, dto, bearerAuth);
					receivedQuiz = (await findAllRelationQuiz(receivedRes.data!.id))!;
				});

				it("response should match openapi doc", () => {
					expect(receivedRes.response.status).toBe(HttpStatus.OK);
					const body = receivedRes.data;
					expectResponseBody(zShowQuizResponse, body);
					expect(body).toEqual(new ShowQuizResponse(receivedQuiz));
				});
				it("quiz should be replaced", () => {
					expectQuizEqual(receivedQuiz, expectedQuizPart);
				});
			});
		});

		describe.each([
			{
				userType: USER_ROLE.USER,
			},
			{
				userType: USER_ROLE.ADMIN,
			},
		])("fail when deliver invalid id or dto by user($userType)", ({ userType }) => {
			const quizStub = factoryQuizStub();
			const ownerStub = factoryUserStub(userType);
			const deletedPaintingStub = factoryPaintingStub();
			let owner: User;

			beforeAll(async () => {
				owner = await testService.insertStubUser(ownerStub);

				const answer = paintings[PAINTING_COUNT.answer - 1];
				const distractors = paintings.slice(
					PAINTING_COUNT.answer,
					PAINTING_COUNT.answer + 3,
				) as [Painting, Painting, Painting];

				assert(distractors.length === 3);

				await testService.insertOneChoiceQuizStubs([
					{
						answer,
						owner,
						quizStub,
						distractors,
					},
				]);

				const [deletedPaintingSource] = await testService.seedPaintings(1);

				const [deletedPainting] = await testService.insertPaintingStubs([
					{
						paintingDummy: deletedPaintingStub,
						artist: deletedPaintingSource.artist,
						styles: deletedPaintingSource.styles,
						tags: deletedPaintingSource.tags,
					},
				]);

				assert(deletedPainting !== undefined);

				const qr = dbService.getQueryRunner();
				await paintingService.deleteOne(qr, deletedPainting);
				await qr.release();
			});
			describe.each([
				{
					testName: "deleted paintingId in answer",
					invalidId: quizStub.id,
					invalidDto: {
						answerPaintingIds: [deletedPaintingStub.id],
						distractorPaintingIds: paintingStubs.slice(0, 3).map((p) => p.id),
						title: faker.book.title(),
						timeLimit: faker.number.int({ min: 0, max: 100 }),
						description: faker.commerce.productDescription(),
					},
				},
				{
					testName: "deleted paintingId in distractor",
					invalidId: quizStub.id,
					invalidDto: {
						answerPaintingIds: paintingStubs.slice(0, 1).map((p) => p.id),
						distractorPaintingIds: [deletedPaintingStub.id].concat(
							paintingStubs.slice(1, 3).map((p) => p.id),
						),
						title: faker.book.title(),
						timeLimit: faker.number.int({ min: 0, max: 100 }),
						description: faker.commerce.productDescription(),
					},
				},
				{
					testName: "leak distractorIds",
					invalidId: quizStub.id,
					invalidDto: {
						answerPaintingIds: paintingStubs.slice(0, 1).map((p) => p.id),
						distractorPaintingIds: paintingStubs.slice(1, 3).map((p) => p.id),
						title: faker.book.title(),
						timeLimit: faker.number.int({ min: 0, max: 100 }),
						description: faker.commerce.productDescription(),
					},
				},
				{
					testName: "over distractorIds",
					invalidId: quizStub.id,
					invalidDto: {
						answerPaintingIds: paintingStubs.slice(0, 1).map((p) => p.id),
						distractorPaintingIds: paintingStubs.slice(1).map((p) => p.id),
						title: faker.book.title(),
						timeLimit: faker.number.int({ min: 0, max: 100 }),
						description: faker.commerce.productDescription(),
					},
				},
				{
					testName: "duplicate distractorIds",
					invalidId: quizStub.id,
					invalidDto: {
						answerPaintingIds: paintingStubs.slice(0, 1).map((p) => p.id),
						distractorPaintingIds: paintingStubs.slice(0, 3).map((p) => p.id),
						title: faker.book.title(),
						timeLimit: faker.number.int({ min: 0, max: 100 }),
						description: faker.commerce.productDescription(),
					},
				},
			])("test : $testName", ({ invalidId, invalidDto }) => {
				let receivedRes: Awaited<ReturnType<typeof requestReplaceQuiz>>;

				beforeAll(async () => {
					const bearerAuth = testService.getBearerAuthCredential(owner);
					receivedRes = await requestReplaceQuiz(
						invalidId,
						invalidDto as ReplaceQuizDto,
						bearerAuth,
					);
				});

				it("response should match openapi doc", () => {
					expect(receivedRes.response.status).toBe(HttpStatus.BAD_REQUEST);
					expect(receivedRes.data).toBeUndefined();
				});
			});
		});

		describe.each([
			{
				userType: USER_ROLE.USER,
			},
			{
				userType: USER_ROLE.ADMIN,
			},
		])("fail when special case by user($userType)", ({ userType }) => {
			//TODO: 특수 상황 실패 테스트 구현
			//-[x] 삭제된 Quiz 수정
			//-[x] 존재하지 않는 Quiz 수정
			//-[x] 다른 사람 리소스 수정 시도
			const quizStub = factoryQuizStub();
			const ownerStub = factoryUserStub(userType);
			const deletedQuizStub = factoryQuizStub();
			const otherUserStub = factoryUserStub("user");
			const otherAdminStub = factoryUserStub("admin");
			let owner: User;

			beforeAll(async () => {
				owner = await testService.insertStubUser(ownerStub);

				const answer = paintings[PAINTING_COUNT.answer - 1];
				const distractors = paintings.slice(
					PAINTING_COUNT.answer,
					PAINTING_COUNT.answer + 3,
				) as [Painting, Painting, Painting];

				assert(distractors.length === 3);

				await testService.insertOneChoiceQuizStubs([
					{
						answer,
						owner,
						quizStub,
						distractors,
					},
				]);

				const [deletedQuiz] = await testService.insertOneChoiceQuizStubs([
					{
						answer,
						owner,
						quizStub: deletedQuizStub,
						distractors,
					},
				]);
				assert(deletedQuiz !== undefined);

				const qr = dbService.getQueryRunner();
				await quizService.softDeleteQuiz(qr, deletedQuiz.id);
				await qr.release();

				await testService.insertStubUser(otherUserStub);
				await testService.insertStubUser(otherAdminStub);
			});
			describe.each([
				{
					testName: "invalid quizId",
					invalidId: faker.string.uuid(),
					invalidDto: {
						answerPaintingIds: paintingStubs.slice(0, 1).map((p) => p.id),
						distractorPaintingIds: paintingStubs.slice(1, 4).map((p) => p.id),
						title: faker.book.title(),
						timeLimit: faker.number.int({ min: 0, max: 100 }),
						description: faker.commerce.productDescription(),
					},
					userId: ownerStub.id,
				},
				{
					testName: "deleted quizId",
					invalidId: deletedQuizStub.id,
					invalidDto: {
						answerPaintingIds: paintingStubs.slice(0, 1).map((p) => p.id),
						distractorPaintingIds: paintingStubs.slice(1, 4).map((p) => p.id),
						title: faker.book.title(),
						timeLimit: faker.number.int({ min: 0, max: 100 }),
						description: faker.commerce.productDescription(),
					},
					userId: ownerStub.id,
				},
				{
					testName: "tried by other user",
					invalidId: quizStub.id,
					invalidDto: {
						answerPaintingIds: paintingStubs.slice(0, 1).map((p) => p.id),
						distractorPaintingIds: paintingStubs.slice(1, 4).map((p) => p.id),
						title: faker.book.title(),
						timeLimit: faker.number.int({ min: 0, max: 100 }),
						description: faker.commerce.productDescription(),
					},
					userId: otherUserStub.id,
				},
				{
					testName: "tried by other admin",
					invalidId: quizStub.id,
					invalidDto: {
						answerPaintingIds: paintingStubs.slice(0, 1).map((p) => p.id),
						distractorPaintingIds: paintingStubs.slice(1, 4).map((p) => p.id),
						title: faker.book.title(),
						timeLimit: faker.number.int({ min: 0, max: 100 }),
						description: faker.commerce.productDescription(),
					},
					userId: otherAdminStub.id,
				},
			])("test : $testName", ({ invalidId, invalidDto, userId }) => {
				let receivedRes: Awaited<ReturnType<typeof requestReplaceQuiz>>;

				beforeAll(async () => {
					const user = await userService.findOne({ where: { id: userId } });
					assert(user !== null);

					const bearerAuth = testService.getBearerAuthCredential(user!);
					receivedRes = await requestReplaceQuiz(
						invalidId,
						invalidDto as ReplaceQuizDto,
						bearerAuth,
					);
				});

				it("response should match openapi doc", () => {
					expect(receivedRes.response.status).toBe(HttpStatus.FORBIDDEN);
					expect(receivedRes.data).toBeUndefined();
				});
			});
		});
	});

	describe("/quiz/:id (DELETE)", () => {
		// TODO: "/quiz/:id (DELETE)" e2e 테스트 구현
		// - [x] 공통 로직 구현
		// - [x] 좋은 데이터 테스트 (id path에 대해서만 테스트)
		// - [x] 나쁜 데이터 테스트 (비유효 query, dto body)
		// - [x] 나쁜 데이터 테스트 (비권한 authorization header )
		// - [ ] 경계 분석 테스트
		async function requestDeleteQuiz(id: string, bearerAuth: string) {
			const response = await client.DELETE(ApiPaths.QuizController_delete, {
				params: {
					path: { id },
					header: {
						authorization: bearerAuth,
					},
				},
			});

			return response;
		}

		describe.each([
			{
				userType: USER_ROLE.USER,
			},
			{
				userType: USER_ROLE.ADMIN,
			},
		])("success when deliver valid id by user($userType)", ({ userType }) => {
			//TODO : 좋은 데이터 테스트 구현
			//-[x] quiz의 owner를 각각 user와 admin으로 테스트 설정
			//-[x] 유효한 id 데이터 전달

			const ownerStub = factoryUserStub(userType);
			const quizStub = factoryQuizStub();
			let owner: User;
			let targetQuiz: Quiz;
			beforeAll(async () => {
				[owner] = await testService.insertUserStubs([ownerStub]);

				const [answer, ...distractors] = await testService.seedPaintings(4);

				assert(distractors.length === 3);
				[targetQuiz] = await testService.insertOneChoiceQuizStubs([
					{
						quizStub,
						answer,
						distractors: distractors as [Painting, Painting, Painting],
						owner,
					},
				]);
				assert(isNotFalsy(targetQuiz));
			});

			afterEach(async () => {
				const manager = dbService.getManager();
				await manager.recover(targetQuiz);
			});

			describe.each([
				{
					testName: "deliver valid quiz id",
					id: quizStub.id,
				},
			])("test : $testName", ({ id }) => {
				let receivedRes: Awaited<ReturnType<typeof requestDeleteQuiz>>;
				let receivedQuiz: Quiz | null;
				beforeAll(async () => {
					const bearerAuth = testService.getBearerAuthCredential(owner);
					receivedRes = await requestDeleteQuiz(id, bearerAuth);
					receivedQuiz = await findAllRelationQuiz(id);
				});
				it("response should match openapi doc", () => {
					expect(receivedRes.response.status).toBe(HttpStatus.OK);
					//"quiz should be deleted"
					expect(receivedQuiz).toBeNull();
				});
			});
		});

		describe.each([
			{
				userType: USER_ROLE.USER,
			},
			{
				userType: USER_ROLE.ADMIN,
			},
		])("$userType : fail when deliver invalid id or auth ", ({ userType }) => {
			//TODO : 좋은 데이터 테스트 구현
			//-[x] quiz의 owner를 각각 user와 admin으로 테스트 설정
			//-[x] 존재하지 않는 quiz id 전달
			const deletedQuizStub = factoryQuizStub();
			const ownerStub = factoryUserStub(userType);
			const quizStub = factoryQuizStub();
			let owner: User;
			let targetQuiz: Quiz;
			beforeAll(async () => {
				[owner] = await testService.insertUserStubs([ownerStub]);

				const [answer, ...distractors] = await testService.seedPaintings(4);

				assert(distractors.length === 3);
				[targetQuiz] = await testService.insertOneChoiceQuizStubs([
					{
						quizStub,
						answer,
						distractors: distractors as [Painting, Painting, Painting],
						owner,
					},
				]);
				assert(isNotFalsy(targetQuiz));

				await testService.insertOneChoiceQuizStubs([
					{
						quizStub: deletedQuizStub,
						answer,
						distractors: distractors as [Painting, Painting, Painting],
						owner,
					},
				]);
				const qr = dbService.getQueryRunner();
				await quizService.softDeleteQuiz(qr, deletedQuizStub.id);
				await qr.release();
			});

			afterEach(async () => {
				const manager = dbService.getManager();
				const quiz = await manager.findOne(Quiz, { where: { id: quizStub.id } });
				assert(quiz !== null);
			});

			describe.each([
				{
					testName: "deliver not existed quiz id",
					invalidId: faker.string.uuid(),
					userId: ownerStub.id,
				},
				{
					testName: "deliver deleted quiz id",
					invalidId: deletedQuizStub.id,
					userId: ownerStub.id,
				},
			])("test : $testName", ({ invalidId, userId }) => {
				let receivedRes: Awaited<ReturnType<typeof requestDeleteQuiz>>;

				beforeAll(async () => {
					const testUser = await userService.findOne({ where: { id: userId } });
					assert(testUser !== null);

					const bearerAuth = testService.getBearerAuthCredential(testUser!);
					receivedRes = await requestDeleteQuiz(invalidId, bearerAuth);
				});

				it("response should match openapi doc", () => {
					expect(receivedRes.response.status).toBe(HttpStatus.BAD_REQUEST);
					expect(receivedRes.data).toBeUndefined();
				});
			});
		});

		describe.each([
			{
				userType: USER_ROLE.USER,
			},
			{
				userType: USER_ROLE.ADMIN,
			},
		])("$userType : fail when special case ", ({ userType }) => {
			//TODO : 좋은 데이터 테스트 구현
			//-[x] quiz의 owner를 각각 user와 admin으로 테스트 설정
			//-[x] 이미 삭제된 quiz id 전달
			//-[x] quiz owner가 아닌 user auth 전달
			//-[x] quiz owner가 아닌 admin auth 전달

			const otherUserStub = factoryUserStub("admin");
			const otherAdminStub = factoryUserStub("user");
			const ownerStub = factoryUserStub(userType);
			const quizStub = factoryQuizStub();
			let owner: User;
			let targetQuiz: Quiz;
			beforeAll(async () => {
				[owner] = await testService.insertUserStubs([ownerStub]);

				const [answer, ...distractors] = await testService.seedPaintings(4);

				assert(distractors.length === 3);
				[targetQuiz] = await testService.insertOneChoiceQuizStubs([
					{
						quizStub,
						answer,
						distractors: distractors as [Painting, Painting, Painting],
						owner,
					},
				]);
				assert(isNotFalsy(targetQuiz));
				await testService.insertUserStubs([otherUserStub, otherAdminStub]);
			});

			afterEach(async () => {
				const manager = dbService.getManager();
				const quiz = await manager.findOne(Quiz, { where: { id: quizStub.id } });
				assert(quiz !== null);
			});

			describe.each([
				{
					testName: "deliver other user id",
					invalidId: quizStub.id,
					userId: otherUserStub.id,
				},
				{
					testName: "deliver other admin id",
					invalidId: quizStub.id,
					userId: otherAdminStub.id,
				},
			])("test : $testName", ({ invalidId, userId }) => {
				let receivedRes: Awaited<ReturnType<typeof requestDeleteQuiz>>;

				beforeAll(async () => {
					const testUser = await userService.findOne({ where: { id: userId } });
					assert(testUser !== null);

					const bearerAuth = testService.getBearerAuthCredential(testUser!);
					receivedRes = await requestDeleteQuiz(invalidId, bearerAuth);
				});

				it("response should match openapi doc", () => {
					expect(receivedRes.response.status).toBe(HttpStatus.FORBIDDEN);
					expect(receivedRes.data).toBeUndefined();
				});
			});
		});
	});
});
