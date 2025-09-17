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
import { omit, pick, sortById } from "../../../src/utils/object";
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
import { factoryQuizReaction } from "./quiz-reaction.stub";
import { USER_ROLE } from "../../../src/modules/user/const";
import { User } from "../../../src/modules/user/entity/user.entity";
import z from "zod";
import { getRandomElement } from "../../../src/utils/random";
import { factoryTagStub } from "../../_shared/stub/tag.stub";
import { factoryArtistStub } from "../../_shared/stub/artist.stub";
import { factoryStyleStub } from "../../_shared/stub/style.stub";
import { isNotFalsy } from "../../../src/utils/validator";

//TODO : Quiz DTO 이름 변경하기. ApiHandlerMethod+DTO 형식으로

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
					id: faker.string.uuid(),
					dto: { isCorrect: true },
				},
				{
					id: faker.string.uuid(),
					dto: { isCorrect: false },
				},
				{
					id: validId,
					dto: { isCorrect: undefined },
				},
				{
					id: validId,
					dto: { isCorrect: 0 },
				},
				{
					id: validId,
					dto: { isCorrect: 1234 },
				},
				{
					id: validId,
					dto: {},
				},
			])("input : %p", ({ id, dto }) => {
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
						id: validQuizId,
						dto: { type: "invalid" },
					},
					{
						id: validQuizId,
						dto: {},
					},
					{
						id: faker.string.uuid(),
						dto: { type: QUIZ_REACTION.dislike },
					},
					{
						id: faker.string.uuid(),
						dto: { type: QUIZ_REACTION.like },
					},
					{
						id: faker.internet.email(),
						dto: { type: QUIZ_REACTION.dislike },
					},
				])("input : %p", ({ id, dto }) => {
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

				await quizService.softDeleteQuiz(dbService.getQueryRunner(), deletedQuizId);
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
					query: {},
				},
				{
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
					query: {
						context: {
							tag: getRandomElement(tagStubs)!.name,
							page: 0,
						},
						currentIndex: 0,
						endIndex: 1,
					},
				},
			])("input : %o ", ({ query }) => {
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
					specialQuery: {
						currentIndex: 100,
						endIndex: 100,
					},
				},
				{
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
			])("input : %o", ({ specialQuery }) => {
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
			])("input : %o", ({ specialQuery }) => {
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
					invalidQuery: {
						invalid: "it is invalid",
					},
				},
				{
					invalidQuery: {
						context: {
							page: 0,
						},
						currentIndex: 0,
						endIndex: 1,
					},
				},
				{
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
					invalidQuery: {
						context: {
							tag: faker.internet.ipv6(),
							page: 0,
						},
						currentIndex: 0,
						endIndex: 1,
					},
				},
			])("input : %o", ({ invalidQuery }) => {
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

		beforeAll(async () => {
			const quizCount = 30;
			const quizzes = await testService.seedOneChoiceQuizzes(quizCount);
			const initQuiz = quizzes.slice(0, 10);

			await Promise.all(
				initQuiz.map((q) =>
					quizScheduleService.initialize([
						{
							artist: q.artists[0].name,
							page: 0,
						},
					]),
				),
			);
		});
		describe("success when deliver minimal dto", () => {
			let receivedRes: Awaited<ReturnType<typeof requestCreateSchedule>>;
			beforeAll(async () => {
				const quizzes = await testService.seedOneChoiceQuizzes(1);
				const targetQuiz = quizzes[0];
				const dto = {
					tag: targetQuiz.tags[0].name,
					page: 0,
				};
				receivedRes = await requestCreateSchedule(dto);
			});

			it("response data should match openapi doc", () => {
				expect(receivedRes.response.status).toBe(HttpStatus.CREATED);
			});
		});

		describe("success when deliver fully dto", () => {
			let receivedRes: Awaited<ReturnType<typeof requestCreateSchedule>>;
			beforeAll(async () => {
				const quizzes = await testService.seedOneChoiceQuizzes(1);
				const targetQuiz = quizzes[0];
				const dto = {
					tag: targetQuiz.tags[0].name,
					artist: targetQuiz.artists[0].name,
					style: targetQuiz.styles[0].name,
					page: 0,
				};
				receivedRes = await requestCreateSchedule(dto);
			});

			it("response data should match openapi doc", () => {
				expect(receivedRes.response.status).toBe(HttpStatus.CREATED);
			});
		});

		describe.each([
			{
				dto: {
					tag: faker.string.uuid(),
					page: 0,
				},
			},
			{
				dto: {
					style: faker.string.uuid(),
					page: 0,
				},
			},
			{
				dto: {
					artist: faker.string.uuid(),
					page: 0,
				},
			},

			{
				dto: {
					artist: faker.string.uuid(),
					page: 0,
				},
			},
		])("input : %p", ({ dto }) => {
			let receivedRes: Awaited<ReturnType<typeof requestCreateSchedule>>;
			beforeAll(async () => {
				receivedRes = await requestCreateSchedule(dto);
			});

			it("response data should match openapi doc", () => {
				expect(receivedRes.response.status).toBe(HttpStatus.BAD_REQUEST);
			});
		});

		describe("fail when fully invalid dto ", () => {
			let receivedRes: Awaited<ReturnType<typeof requestCreateSchedule>>;
			beforeAll(async () => {
				const dto = {
					tag: faker.string.uuid(),
					artist: faker.string.uuid(),
					style: faker.string.uuid(),
					page: 0,
				};
				receivedRes = await requestCreateSchedule(dto);
			});

			it("response data should match openapi doc", () => {
				expect(receivedRes.response.status).toBe(HttpStatus.BAD_REQUEST);
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

		type PaintingLeast3 = [Painting, Painting, Painting];
		function factoryCreateQuizDto(answer: Painting, distractor: PaintingLeast3): CreateQuizDto {
			const { time_limit: timeLimit, description, title } = factoryQuizStub();
			const dto: CreateQuizDto = {
				type: QUIZ_TYPE.ONE_CHOICE,
				answerPaintingIds: [answer.id],
				distractorPaintingIds: distractor.map((p) => p.id),
				title,
				timeLimit,
				description,
			};

			return dto;
		}

		describe("success when create quiz by user", () => {
			let receivedRes: Awaited<ReturnType<typeof requestCreateQuiz>>;

			let expectedQuizPart: ExpectedQuizPart;
			let receivedQuiz: Quiz | null;

			beforeAll(async () => {
				const creator = await testService.insertStubUser(factoryUserStub("user"));
				const paintings = await testService.seedPaintings(4);
				const answer = paintings[0];
				const distractors = paintings.slice(1) as PaintingLeast3;
				const dto = factoryCreateQuizDto(answer, distractors);
				expectedQuizPart = {
					answer_paintings: [answer],
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

		describe("fail when invalid auth", () => {
			let receivedRes: Awaited<ReturnType<typeof requestCreateQuiz>>;
			let receivedQuiz: Quiz | null;

			beforeAll(async () => {
				const creator = await testService.insertStubUser(factoryUserStub("user"));
				const paintings = await testService.seedPaintings(4);
				const answer = paintings[0];
				const distractors = paintings.slice(1) as PaintingLeast3;
				const dto = factoryCreateQuizDto(answer, distractors);

				const invalidBearerAuth = testService.getBearerAuthCredential(creator) + "invalid";
				receivedRes = await requestCreateQuiz(dto, invalidBearerAuth);
				receivedQuiz = await findAllRelationQuiz(receivedRes.data!.id);
			});

			it("response should follow openapi doc", () => {
				expect(receivedRes.response.status).toBe(HttpStatus.FORBIDDEN);
			});

			it("quiz should not created", () => {
				expect(receivedQuiz).toBeNull();
			});
		});

		describe("fail when invalid referring wrong painting", () => {
			let receivedRes: Awaited<ReturnType<typeof requestCreateQuiz>>;
			let receivedQuiz: Quiz | null;

			beforeAll(async () => {
				const creator = await testService.insertStubUser(factoryUserStub("user"));
				const paintings = await testService.seedPaintings(4);
				const answer = paintings[0];
				const distractors = paintings.slice(1) as PaintingLeast3;
				const dto = factoryCreateQuizDto(answer, distractors);

				dto.answerPaintingIds[0] = faker.string.uuid();

				const bearerAuth = testService.getBearerAuthCredential(creator);
				receivedRes = await requestCreateQuiz(dto, bearerAuth);
				receivedQuiz = await findAllRelationQuiz(receivedRes.data!.id);
			});

			it("response should follow openapi doc", () => {
				expect(receivedRes.response.status).toBe(HttpStatus.BAD_REQUEST);
			});

			it("quiz should not created", () => {
				expect(receivedQuiz).toBeNull();
			});
		});

		describe("fail when invalid dto referring deleted painting", () => {
			let receivedRes: Awaited<ReturnType<typeof requestCreateQuiz>>;
			let receivedQuiz: Quiz | null;

			beforeAll(async () => {
				const creator = await testService.insertStubUser(factoryUserStub("user"));
				const paintings = await testService.seedPaintings(4);
				const answer = paintings[0];
				const distractors = paintings.slice(1) as PaintingLeast3;
				const dto = factoryCreateQuizDto(answer, distractors);

				//delete painting;
				await paintingService.deleteOne(dbService.getQueryRunner(), answer);

				const bearerAuth = testService.getBearerAuthCredential(creator);
				receivedRes = await requestCreateQuiz(dto, bearerAuth);
				receivedQuiz = await findAllRelationQuiz(receivedRes.data!.id);
			});

			it("response should follow openapi doc", () => {
				expect(receivedRes.response.status).toBe(HttpStatus.BAD_REQUEST);
			});

			it("quiz should not created", () => {
				expect(receivedQuiz).toBeNull();
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

		function sortByAlphabet(arr: string[]) {
			return arr.sort((str1, str2) => str1.localeCompare(str2));
		}

		describe("success when search quiz without query", () => {
			let receivedRes: Awaited<ReturnType<typeof requestSearchQuiz>>;
			let expectedData: PaginationShowQuiz;
			beforeAll(async () => {
				await dbService.resetDB();
				const countPerPage = 20;
				const quizzes = await testService.seedOneChoiceQuizzes(countPerPage);
				expectedData = {
					data: quizzes.map((q) => new ShowQuiz(q)),
					count: countPerPage,
					page: 0,
					total: countPerPage,
					pageCount: 1,
				};
				receivedRes = await requestSearchQuiz();
			});

			it("response should match openapi doc", () => {
				expect(receivedRes.response.status).toBe(HttpStatus.OK);
				expectResponseBody(zPagination(zShowQuiz), receivedRes.data);
			});
			it("response data should be expected", () => {
				const pickedKey = ["count", "page", "pageCount", "total"] as const;
				expect(pick(receivedRes.data!, pickedKey)).toBe(pick(expectedData, pickedKey));
				const expectedSearchQuiz = sortById(expectedData.data);
				const receivedSearchQuiz = sortById(receivedRes.data!.data);
				expect(receivedSearchQuiz).toEqual(expectedSearchQuiz);
			});
		});
		describe("success when search quiz by tag", () => {
			let receivedRes: Awaited<ReturnType<typeof requestSearchQuiz>>;
			let expectedData: PaginationShowQuiz;
			beforeAll(async () => {
				await dbService.resetDB();
				const countPerPage = 20;
				const quizCount = 40;
				const quizzes = await testService.seedOneChoiceQuizzes(quizCount);
				const targetTag = quizzes[0].tags[0];
				const filteredQuizzes = quizzes
					.filter((q) => q.tags.some((t) => t.id === targetTag.id))
					.map((q) => new ShowQuiz(q));

				expectedData = {
					data: filteredQuizzes.slice(0, countPerPage),
					count: Math.min(countPerPage, filteredQuizzes.length),
					page: 0,
					total: filteredQuizzes.length,
					pageCount: Math.ceil(filteredQuizzes.length / countPerPage),
				};
				const query = {
					tags: [targetTag.name],
				};
				receivedRes = await requestSearchQuiz(query);
			});

			it("response should match openapi doc", () => {
				expect(receivedRes.response.status).toBe(HttpStatus.OK);
				expectResponseBody(zPagination(zShowQuiz), receivedRes.data);
			});
			it("response data should match with expected", () => {
				const pickedKey = ["count", "page", "pageCount", "total"] as const;
				expect(pick(receivedRes.data!, pickedKey)).toBe(pick(expectedData, pickedKey));
				const expectedSearchQuiz = sortById(expectedData.data);
				const receivedSearchQuiz = sortById(receivedRes.data!.data);
				expect(receivedSearchQuiz).toEqual(expectedSearchQuiz);
			});
		});

		describe("success when searching with query", () => {
			let receivedRes: Awaited<ReturnType<typeof requestSearchQuiz>>;
			let query: SearchQuizQuery;
			beforeAll(async () => {
				await dbService.resetDB();
				const quizCount = 1000;
				const quizzes = await testService.seedOneChoiceQuizzes(quizCount);
				const targetQuiz = quizzes[0];
				query = {
					tags: targetQuiz.tags.map((t) => t.name).slice(0, 1),
					artists: targetQuiz.artists.map((a) => a.name).slice(0, 1),
					styles: targetQuiz.styles.map((s) => s.name).slice(0, 1),
					page: 0,
				};
				receivedRes = await requestSearchQuiz(query);
			});

			it("response should match openapi doc", () => {
				expect(receivedRes.response.status).toBe(HttpStatus.OK);
				expectResponseBody(zPagination(zShowQuiz), receivedRes.data);
			});
			it("response data should contain query conditions", async () => {
				const quizInfos = receivedRes.data as PaginationShowQuiz;
				const quizzes = await Promise.all(
					quizInfos.data.map((info) => findAllRelationQuiz(info.id)),
				);
				for (const quiz of quizzes) {
					expect(quiz).toBeDefined();
					const { tags, artists, styles } = quiz!;
					expect(sortByAlphabet(query.tags!)).toMatchObject(
						sortByAlphabet(tags.map((t) => t.name)),
					);

					expect(sortByAlphabet(query.artists!)).toMatchObject(
						sortByAlphabet(artists.map((a) => a.name)),
					);

					expect(sortByAlphabet(query.styles!)).toMatchObject(
						sortByAlphabet(styles.map((s) => s.name)),
					);
				}
			});
		});

		describe("success when searching with more conditions query", () => {
			let receivedRes: Awaited<ReturnType<typeof requestSearchQuiz>>;
			let query: SearchQuizQuery;
			beforeAll(async () => {
				const quizCount = 1000;
				const quizzes = await testService.seedOneChoiceQuizzes(quizCount);
				const targetQuiz = quizzes[0];
				query = {
					tags: targetQuiz.tags.map((t) => t.name),
					artists: targetQuiz.artists.map((a) => a.name),
					styles: targetQuiz.styles.map((s) => s.name),
					page: 0,
				};
				receivedRes = await requestSearchQuiz(query);
			});

			it("response should match openapi doc", () => {
				expect(receivedRes.response.status).toBe(HttpStatus.OK);
				expectResponseBody(zPagination(zShowQuiz), receivedRes.data);
			});
			it("response data should contain query conditions", async () => {
				const quizInfos = receivedRes.data as PaginationShowQuiz;
				const quizzes = await Promise.all(
					quizInfos.data.map((info) => findAllRelationQuiz(info.id)),
				);
				for (const quiz of quizzes) {
					expect(quiz).toBeDefined();
					const { tags, artists, styles } = quiz!;
					expect(sortByAlphabet(query.tags!)).toMatchObject(
						sortByAlphabet(tags.map((t) => t.name)),
					);

					expect(sortByAlphabet(query.artists!)).toMatchObject(
						sortByAlphabet(artists.map((a) => a.name)),
					);

					expect(sortByAlphabet(query.styles!)).toMatchObject(
						sortByAlphabet(styles.map((s) => s.name)),
					);
				}
			});
		});
		describe("success when invalid query referring not exist artist", () => {
			let receivedRes: Awaited<ReturnType<typeof requestSearchQuiz>>;
			let query: SearchQuizQuery;
			beforeAll(async () => {
				const quizCount = 10;
				await testService.seedOneChoiceQuizzes(quizCount);
				query = {
					artists: [faker.string.uuid()],
				};
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

		describe("success when invalid query referring not exist style and referring valid tag", () => {
			let receivedRes: Awaited<ReturnType<typeof requestSearchQuiz>>;
			let query: SearchQuizQuery;
			beforeAll(async () => {
				const quizCount = 10;
				const quizzes = await testService.seedOneChoiceQuizzes(quizCount);
				const targetQuiz = quizzes[0];
				query = {
					tags: targetQuiz.tags.map((t) => t.name),
					styles: [faker.string.alpha()],
					page: 0,
				};
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

		describe("fail when invalid query referring big page", () => {
			let receivedRes: Awaited<ReturnType<typeof requestSearchQuiz>>;
			let query: SearchQuizQuery;
			beforeAll(async () => {
				const quizCount = 10;
				await testService.seedOneChoiceQuizzes(quizCount);
				query = {
					page: quizCount * 10,
				};
				receivedRes = await requestSearchQuiz(query);
			});

			//TODO 응답 확인 필요
			it("response should 500 status", () => {
				expect(receivedRes.response.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
				expect(receivedRes.data).toBeUndefined();
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
		describe("success quiz when without query", () => {
			let receivedRes: Awaited<ReturnType<typeof requestReadQuiz>>;
			let expectedQuiz: Quiz;

			beforeAll(async () => {
				const count = 1;
				const quizzes = await testService.seedOneChoiceQuizzes(count);
				expectedQuiz = quizzes[0];

				receivedRes = await requestReadQuiz(expectedQuiz.id);
			});
			it("response should match openapi doc", () => {
				expect(receivedRes.response.status).toBe(HttpStatus.OK);
				expectResponseBody(zDetailQuizResponse, receivedRes.data);
			});

			it("received quiz should be expected", () => {
				expect(receivedRes.data?.quiz).toBe(new ShowQuizResponse(expectedQuiz));
				expectResponseBody(zDetailQuizResponse, receivedRes.data);
			});
		});

		describe("success when deliver userId in query", () => {
			let receivedRes: Awaited<ReturnType<typeof requestReadQuiz>>;
			let expectedQuiz: Quiz;

			beforeAll(async () => {
				const count = 1;
				const quizzes = await testService.seedOneChoiceQuizzes(count);
				const testUser = await testService.insertStubUser(factoryUserStub("user"));
				expectedQuiz = quizzes[0];
				await testService.insertQuizReaction([
					{
						reactionStub: factoryQuizReaction("like"),
						user: testUser,
						quiz: expectedQuiz,
					},
				]);

				receivedRes = await requestReadQuiz(expectedQuiz.id, {
					userId: testUser.id,
				});
			});
			it("response should match openapi doc", () => {
				expect(receivedRes.response.status).toBe(HttpStatus.OK);
				expectResponseBody(zDetailQuizResponse, receivedRes.data);
			});

			it("received quiz should be expected", async () => {
				const expectedData = new DetailQuizResponse(
					expectedQuiz,
					await quizService.getQuizReactionCounts(expectedQuiz.id),
					"like",
				);
				expect(receivedRes.data!).toEqual(expectedData);
			});
		});

		describe("fail when invalid :id path", () => {
			let receivedRes: Awaited<ReturnType<typeof requestReadQuiz>>;

			beforeAll(async () => {
				const invalidId = faker.string.uuid();
				receivedRes = await requestReadQuiz(invalidId, {});
			});
			it("response should match openapi doc", () => {
				expect(receivedRes.response.status).toBe(HttpStatus.BAD_REQUEST);
				expect(receivedRes.data).toBeUndefined();
			});
		});

		describe("fail when try to read deleted quiz", () => {
			let receivedRes: Awaited<ReturnType<typeof requestReadQuiz>>;

			beforeAll(async () => {
				const count = 1;
				const quizzes = await testService.seedOneChoiceQuizzes(count);
				const testUser = await testService.insertStubUser(factoryUserStub("user"));
				const targetQuiz = quizzes[0];
				await testService.insertQuizReaction([
					{
						reactionStub: factoryQuizReaction("like"),
						user: testUser,
						quiz: targetQuiz,
					},
				]);

				await quizService.softDeleteQuiz(dbService.getQueryRunner(), targetQuiz.id);

				const invalidId = faker.string.uuid();
				receivedRes = await requestReadQuiz(invalidId, {});
			});
			it("response should match openapi doc", () => {
				expect(receivedRes.response.status).toBe(HttpStatus.BAD_REQUEST);
				expect(receivedRes.data).toBeUndefined();
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

		type PaintingLeast3 = [Painting, Painting, Painting];
		function factoryReplaceQuizDto(
			answer: Painting,
			distractor: PaintingLeast3,
		): ReplaceQuizDto {
			const { time_limit: timeLimit, description, title } = factoryQuizStub();
			const dto: CreateQuizDto = {
				type: QUIZ_TYPE.ONE_CHOICE,
				answerPaintingIds: [answer.id],
				distractorPaintingIds: distractor.map((p) => p.id),
				title,
				timeLimit,
				description,
			};

			return dto;
		}

		describe("success when update quiz without painting", () => {
			let receivedRes: Awaited<ReturnType<typeof requestReplaceQuiz>>;
			let expectedQuizPart: ExpectedQuizPart;
			let dto: ReplaceQuizDto;
			let receivedQuiz: Quiz;

			beforeAll(async () => {
				const count = 1;
				const quizzes = await testService.seedOneChoiceQuizzes(count);
				const targetQuiz = quizzes[0];
				const testUser = quizzes[0].owner;
				dto = factoryReplaceQuizDto(
					quizzes[0].answer_paintings[0],
					quizzes[0].distractor_paintings as PaintingLeast3,
				);

				expectedQuizPart = {
					description: dto.description,
					title: dto.title,
					time_limit: dto.timeLimit,
					owner: targetQuiz.owner,
					answer_paintings: quizzes[0].answer_paintings.slice(0, 1),
					distractor_paintings: quizzes[0].distractor_paintings,
				};

				const bearerAuth = testService.getBearerAuthCredential(testUser);
				receivedRes = await requestReplaceQuiz(targetQuiz.id, dto, bearerAuth);
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

		describe("success when update quiz's paintings", () => {
			let receivedRes: Awaited<ReturnType<typeof requestReplaceQuiz>>;
			let expectedQuizPart: ExpectedQuizPart;
			let dto: ReplaceQuizDto;
			let receivedQuiz: Quiz;

			beforeAll(async () => {
				const count = 1;
				const quizzes = await testService.seedOneChoiceQuizzes(count);
				const targetQuiz = quizzes[0];
				const testUser = quizzes[0].owner;

				const [answer, ...distractors] = (await testService.seedPaintings(4)) as [
					Painting,
					Painting,
					Painting,
					Painting,
				];
				dto = factoryReplaceQuizDto(answer, distractors);

				expectedQuizPart = {
					description: dto.description,
					title: dto.title,
					time_limit: dto.timeLimit,
					owner: targetQuiz.owner,
					answer_paintings: [answer],
					distractor_paintings: distractors,
				};

				const bearerAuth = testService.getBearerAuthCredential(testUser);
				receivedRes = await requestReplaceQuiz(targetQuiz.id, dto, bearerAuth);
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

		describe("fail when invalid dto referring not exist painting ", () => {
			let receivedRes: Awaited<ReturnType<typeof requestReplaceQuiz>>;
			let expectedQuiz: Quiz;
			let dto: ReplaceQuizDto;
			let receivedQuiz: Quiz;

			beforeAll(async () => {
				const count = 1;
				const quizzes = await testService.seedOneChoiceQuizzes(count);
				expectedQuiz = quizzes[0];
				const testUser = expectedQuiz.owner;

				const [answer, ...distractors] = (await testService.seedPaintings(4)) as [
					Painting,
					Painting,
					Painting,
					Painting,
				];
				dto = factoryReplaceQuizDto(answer, distractors);

				//set invalid painting id
				dto.answerPaintingIds = [faker.string.uuid()];

				const bearerAuth = testService.getBearerAuthCredential(testUser);
				receivedRes = await requestReplaceQuiz(expectedQuiz.id, dto, bearerAuth);
				receivedQuiz = (await findAllRelationQuiz(receivedRes.data!.id))!;
			});

			it("response should match openapi doc", () => {
				expect(receivedRes.response.status).toBe(HttpStatus.BAD_REQUEST);
				expect(receivedRes.data).toBeUndefined();
			});
			it("quiz should not be replaced", () => {
				expect(receivedQuiz).toEqual(expectedQuiz);
			});
		});
		describe("fail when try to update by other admin", () => {
			let receivedRes: Awaited<ReturnType<typeof requestReplaceQuiz>>;
			let expectedQuiz: Quiz;
			let dto: ReplaceQuizDto;
			let receivedQuiz: Quiz;

			beforeAll(async () => {
				const count = 1;
				const quizzes = await testService.seedOneChoiceQuizzes(count);
				expectedQuiz = quizzes[0];
				const otherUser = await testService.insertStubUser(factoryUserStub("admin"));

				const [answer, ...distractors] = (await testService.seedPaintings(4)) as [
					Painting,
					Painting,
					Painting,
					Painting,
				];
				dto = factoryReplaceQuizDto(answer, distractors);

				const bearerAuth = testService.getBearerAuthCredential(otherUser);
				receivedRes = await requestReplaceQuiz(expectedQuiz.id, dto, bearerAuth);
				receivedQuiz = (await findAllRelationQuiz(receivedRes.data!.id))!;
			});
			it("response should match openapi doc", () => {
				expect(receivedRes.response.status).toBe(HttpStatus.FORBIDDEN);
				expect(receivedRes.data).toBeUndefined();
			});

			it("quiz should not be replaced", () => {
				expect(receivedQuiz).toEqual(expectedQuiz);
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
		describe("success when delete quiz", () => {
			let receivedRes: Awaited<ReturnType<typeof requestDeleteQuiz>>;
			let receivedQuiz: Quiz | null;

			beforeAll(async () => {
				const count = 1;
				const quizzes = await testService.seedOneChoiceQuizzes(count);
				const targetQuiz = quizzes[0];
				const testUser = targetQuiz.owner;

				const bearerAuth = testService.getBearerAuthCredential(testUser);
				receivedRes = await requestDeleteQuiz(targetQuiz.id, bearerAuth);
				receivedQuiz = (await findAllRelationQuiz(targetQuiz.id))!;
			});
			it("response should match openapi doc", () => {
				expect(receivedRes.response.status).toBe(HttpStatus.OK);
			});

			it("quiz should be deleted", () => {
				expect(receivedQuiz).toBeNull();
			});
		});

		describe("fail when invalid :id path referring already deleted quiz", () => {
			let receivedRes: Awaited<ReturnType<typeof requestDeleteQuiz>>;

			beforeAll(async () => {
				const count = 1;
				const quizzes = await testService.seedOneChoiceQuizzes(count);
				const targetQuiz = quizzes[0];
				const testUser = targetQuiz.owner;

				//delete quiz
				await quizService.softDeleteQuiz(dbService.getQueryRunner(), targetQuiz.id);

				const bearerAuth = testService.getBearerAuthCredential(testUser);
				receivedRes = await requestDeleteQuiz(targetQuiz.id, bearerAuth);
			});

			it("response should match openapi doc", () => {
				expect(receivedRes.response.status).toBe(HttpStatus.BAD_REQUEST);
				expect(receivedRes.data).toBeUndefined();
			});
		});
		describe("fail when invalid :id path referring not exist quiz", () => {
			let receivedRes: Awaited<ReturnType<typeof requestDeleteQuiz>>;

			beforeAll(async () => {
				const testUser = await testService.insertStubUser(factoryUserStub("user"));

				const invalidId = faker.string.uuid();

				const bearerAuth = testService.getBearerAuthCredential(testUser);
				receivedRes = await requestDeleteQuiz(invalidId, bearerAuth);
			});
			it("response should match openapi doc", () => {
				expect(receivedRes.response.status).toBe(HttpStatus.BAD_REQUEST);
			});
		});

		describe("fail when try to delete by other admin", () => {
			let receivedRes: Awaited<ReturnType<typeof requestDeleteQuiz>>;
			let receivedQuiz: Quiz | null;
			let expectedQuiz: Quiz;
			beforeAll(async () => {
				const count = 1;
				const quizzes = await testService.seedOneChoiceQuizzes(count);
				expectedQuiz = quizzes[0];
				const otherAdmin = await testService.insertStubUser(factoryUserStub("admin"));

				const bearerAuth = testService.getBearerAuthCredential(otherAdmin);
				receivedRes = await requestDeleteQuiz(expectedQuiz.id, bearerAuth);
				receivedQuiz = (await findAllRelationQuiz(expectedQuiz.id))!;
			});
			it("response should match openapi doc", () => {
				expect(receivedRes.response.status).toBe(HttpStatus.FORBIDDEN);
				expect(receivedRes.data).toBeUndefined();
			});

			it("quiz should not be deleted", () => {
				expect(receivedQuiz).toBeDefined();
				expect(receivedQuiz).toEqual(expectedQuiz);
			});
		});
	});
});
