/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { HttpStatus, INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { AppModule } from "../../../src/app.module";
import { DatabaseService } from "../../../src/modules/db/db.service";
import { configNestApp } from "../../../src/app.config";
import { TestModule } from "../../_shared/test.module";
import { TestService } from "../../_shared/test.service";
import { factoryUserStub } from "../../_shared/stub/user.stub";
import { faker } from "@faker-js/faker";
import createClient from "openapi-fetch";
import { ApiPaths, paths, USER_ROLE, USER_STATE } from "../../generated/dto-types";
import { expectResponseBody } from "../_common/jest-zod";
import { zShowUserResponse } from "./zodSchema";
import { UserService } from "../../../src/modules/user/user.service";
import { AuthService } from "../../../src/modules/auth/auth.service";
import { pick } from "../../../src/utils/object";
import assert from "assert";
import { arrangeDeletedUser, getOneTimeTokenHeader } from "./util";
import { HeaderOneTimeToken } from "../_common/type";

if (process.env.VSCODE_INSPECTOR_OPTIONS) {
	console.log("Set setTimeout for debugging");
	jest.setTimeout(60 * 1000 * 10); // 10 minutes
}

describe("UserController (e2e)", () => {
	let app: INestApplication;
	let dbService: DatabaseService;
	let testService: TestService;
	let userService: UserService;
	let authService: AuthService;
	const port = 3001;
	const client = createClient<paths>({ baseUrl: `http://localhost:${port}` });
	let moduleFixture: TestingModule;
	// TODO 테스트 환경 설정하기
	// [x] nest.js APP 인스턴스 생성
	// [x] nest.js APP 인스턴스 설정(global pipe, Module, .env.test)
	// [x] 테스트 DB 연결
	// [x] 테스트 DB 데이터정의
	// [x] 테스트 DB 데이터 삽입 로직 추가
	// [x] 테스트 DB 데이터 삭제 로직
	// [x] 테스트 종료후 APP 인스턴스 종료

	beforeAll(async () => {
		moduleFixture = await Test.createTestingModule({
			imports: [AppModule, TestModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		configNestApp(app);
		await app.init();

		testService = moduleFixture.get(TestService);
		userService = moduleFixture.get(UserService);
		authService = moduleFixture.get(AuthService);
		dbService = moduleFixture.get(DatabaseService);
		await dbService.resetDB();
		await app.listen(port);
	});

	afterAll(async () => {
		await app.close();
	});

	describe("/user/:id (GET)", () => {
		// TODO: "/user/:id (GET)" e2e 테스트 구현
		// - [x] 공통 로직 구현
		// - [x] 좋은 데이터 테스트
		// - [x] 나쁜 데이터 테스트 (비유효 id path)

		async function requestReadUser(id: string) {
			const route = ApiPaths.UserController_getOne;
			const response = await client.GET(route, {
				params: {
					path: {
						id,
					},
				},
			});

			return response;
		}

		describe.each([{ userType: USER_ROLE.user }, { userType: USER_ROLE.admin }])(
			"success when deliver valid id path by $userType",
			({ userType }) => {
				const userStub = factoryUserStub(userType);

				beforeAll(async () => {
					await testService.insertStubUser(userStub);
				});
				describe.each([
					{
						testName: "deliver valid id path",
						id: userStub.id,
					},
				])("test : $testName", ({ id }) => {
					let receivedRes: Awaited<ReturnType<typeof requestReadUser>>;
					beforeAll(async () => {
						receivedRes = await requestReadUser(id);
					});
					it("response should match the OpenAPI documentation.", () => {
						expect(receivedRes.response.status).toBe(HttpStatus.OK);
						const receivedBody = receivedRes.data;
						expect(receivedBody).toBeDefined();
						expectResponseBody(zShowUserResponse, receivedBody);
					});
				});
			},
		);

		describe("fail when deliver invalid id path", () => {
			const deletedUserStub = factoryUserStub("user");
			const deletedAdminStub = factoryUserStub("admin");
			beforeAll(async () => {
				await testService.insertUserStubs([deletedUserStub, deletedAdminStub]);
				await arrangeDeletedUser(moduleFixture, deletedUserStub);
				await arrangeDeletedUser(moduleFixture, deletedAdminStub);
			});
			describe.each([
				{
					testName: "deliver invalid format id path",
					invalidId: faker.string.ulid(),
				},
				{
					testName: "deliver not existed id path",
					invalidId: faker.string.uuid(),
				},
				{
					testName: "deliver deleted User's id path",
					invalidId: deletedUserStub.id,
				},
				{
					testName: "deliver deleted admin's id path",
					invalidId: deletedAdminStub.id,
				},
			])("test : $testName", ({ invalidId }) => {
				let receivedRes: Awaited<ReturnType<typeof requestReadUser>>;
				beforeAll(async () => {
					receivedRes = await requestReadUser(invalidId);
				});
				it("response should match the OpenAPI documentation.", () => {
					expect(receivedRes.response.status).toBe(HttpStatus.BAD_REQUEST);
				});
			});
		});
	});

	describe("/user (POST)", () => {
		// TODO: "/user (POST)"" e2e 테스트 구현
		// - [x] 공통 로직 구현
		// - [x] 좋은 데이터 테스트
		// - [x] 나쁜 데이터 테스트 (비유효 body)
		// - [x] 나쁜 데이터 테스트 (비유효 oneTimeToken)
		// - [x] 특수 상황 테스트 (사용된 oneTimeToken 전달)
		// - [ ] 특수 상황 테스트 (만료된 oneTimeToken 전달)
		async function requestCreateUser(
			body: { password: string; username: string },
			header: HeaderOneTimeToken,
		) {
			const route = ApiPaths.createOneBaseUserControllerUser;
			const response = await client.POST(route, {
				params: {
					header,
				},
				body,
			});

			return response;
		}

		describe("success when deliver valid body and header", () => {
			describe.each([
				{
					testName: "deliver body and header",
					email: faker.internet.email({ firstName: "testing" }),
					body: {
						username: faker.internet.username({ firstName: "iniT" }),
						password: faker.internet.password(),
					},
				},
			])("test : $testName", ({ email, body }) => {
				let receivedRes: Awaited<ReturnType<typeof requestCreateUser>>;
				beforeAll(async () => {
					const header = await getOneTimeTokenHeader(moduleFixture, email, "sign-up");
					receivedRes = await requestCreateUser(body, header);
				});

				it("response should match the OpenAPI documentation. doc", () => {
					expect(receivedRes.response.status).toBe(HttpStatus.CREATED);
					const receivedBody = receivedRes.data;
					expect(receivedBody).toBeDefined();
					expectResponseBody(zShowUserResponse, receivedBody);
				});
				it("User entity should be created", async () => {
					const receivedBody = receivedRes.data!;
					const receivedEntity = await userService.findOne({
						where: { id: receivedBody.id },
					});
					expect(receivedEntity).toBeDefined();
				});

				it("response body should be expected ", () => {
					const receivedBody = receivedRes.data!;
					const expectedFieldData = {
						role: USER_ROLE.user,
						active: USER_STATE.active,
						email,
						username: body.username,
					};
					const fields = ["role", "active", "username"] as const;
					expect(pick(receivedBody, fields)).toEqual(pick(expectedFieldData, fields));
				});
			});
		});

		describe("fail when deliver invalid body", () => {
			describe.each([
				{
					testName: "deliver too long username",
					email: faker.internet.email(),
					invalidBody: {
						username: Array(10).fill(faker.internet.username()).join(),
						password: faker.internet.password(),
					},
				},
				{
					testName: "deliver too long password",
					email: faker.internet.email(),
					invalidBody: {
						username: faker.internet.username(),
						password: Array(10).fill(faker.internet.password()).join(),
					},
				},
			])("test : $testName", ({ email, invalidBody }) => {
				let receivedRes: Awaited<ReturnType<typeof requestCreateUser>>;
				beforeAll(async () => {
					const header = await getOneTimeTokenHeader(moduleFixture, email, "sign-up");
					receivedRes = await requestCreateUser(invalidBody, header);
				});

				it("response should match the OpenAPI documentation. doc", () => {
					expect(receivedRes.response.status).toBe(HttpStatus.BAD_REQUEST);
				});
			});
		});

		describe("fail when deliver invalid header", () => {
			describe.each([
				{
					testName: "deliver not issued oneTimeToken",
					body: {
						username: faker.internet.username(),
						password: faker.internet.password(),
					},
					invalidHeader: {
						"x-one-time-token-identifier": faker.string.uuid(),
						"x-one-time-token-value": faker.internet.jwt(),
					},
				},
			])("test : $testName", ({ body, invalidHeader }) => {
				let receivedRes: Awaited<ReturnType<typeof requestCreateUser>>;
				beforeAll(async () => {
					receivedRes = await requestCreateUser(body, invalidHeader);
				});

				it("response should match the OpenAPI documentation. doc", () => {
					expect(receivedRes.response.status).toBe(HttpStatus.UNAUTHORIZED);
				});
			});
		});

		describe.each([{ userType: USER_ROLE.user }, { userType: USER_ROLE.admin }])(
			"fail when special case for header",
			({ userType }) => {
				const userStub = factoryUserStub(userType);

				beforeAll(async () => {
					await testService.insertStubUser(userStub);
				});
				describe.each([
					{
						testName: "deliver used oneTimeToken",
						requestUserEmail: userStub.email,
						body: {
							username: faker.internet.username(),
							password: faker.internet.password(),
						},
						oneTimeTokenOption: {
							isUsed: true,
						},
					},
				])("test : $testName", ({ requestUserEmail, body, oneTimeTokenOption }) => {
					let receivedRes: Awaited<ReturnType<typeof requestCreateUser>>;
					beforeAll(async () => {
						const header = await getOneTimeTokenHeader(
							moduleFixture,
							requestUserEmail,
							"update-password",
							oneTimeTokenOption,
						);

						receivedRes = await requestCreateUser(body, header);
					});

					it("response should match the OpenAPI documentation. doc", () => {
						expect(receivedRes.response.status).toBe(HttpStatus.FORBIDDEN);
					});
				});
			},
		);
	});

	describe("/user/:email/password (PUT)", () => {
		// TODO: "/user/:email/password (PUT)" e2e 테스트 구현
		// - [x] 공통 로직 구현
		// - [x] 좋은 데이터 테스트
		// - [x] 나쁜 데이터 테스트 (비유효 body, 비유효 path)
		// - [x] 나쁜 데이터 테스트 (비유효 oneTimeToken,이미 사용된 oneTimeToken,다른 사용자 oneTimeToken, 삭제된 사용자의 oneTimeToken )
		// - [ ] 특수 상황 테스트 (만료된 oneTimeToken)
		// - [ ] 특수 상황 테스트 (oneTimeToken 발급 직후 계정 삭제한 상황에서의 요청)
		async function requestUpdatePassword(
			id: string,
			body: { password: string },
			header: HeaderOneTimeToken,
		) {
			const route = ApiPaths.UserController_replacePassword;
			const response = await client.PUT(route, {
				params: {
					path: {
						id,
					},
					header,
				},
				body,
			});

			return response;
		}

		describe.each([{ userType: USER_ROLE.user }, { userType: USER_ROLE.admin }])(
			"success when deliver valid id path and body",
			({ userType }) => {
				const userStub = factoryUserStub(userType);

				beforeAll(async () => {
					await testService.insertStubUser(userStub);
				});
				describe.each([
					{
						testName: "deliver password containing Lower and Upper english letters",
						userId: userStub.id,
						userEmail: userStub.email,
						body: {
							password: "updatedPassword",
						},
					},
				])("test : $testName", ({ userId, userEmail, body }) => {
					let receivedRes: Awaited<ReturnType<typeof requestUpdatePassword>>;
					beforeAll(async () => {
						const header = await getOneTimeTokenHeader(
							moduleFixture,
							userEmail,
							"update-password",
						);

						receivedRes = await requestUpdatePassword(userId, body, header);
					});

					it("response should match the OpenAPI documentation. doc", () => {
						expect(receivedRes.response.status).toBe(HttpStatus.OK);
						const receivedBody = receivedRes.data!;
						expect(receivedBody).toBeUndefined();
					});

					it("User entity's password field should be updated", async () => {
						const receivedUser = await userService.findOne({
							where: { id: userId },
						});
						const isChanged = await authService.isHashMatched(
							body.password,
							receivedUser!.password,
						);
						expect(isChanged).toBe(true);
					});
				});
			},
		);

		describe.each([{ userType: USER_ROLE.user }, { userType: USER_ROLE.admin }])(
			"fail when deliver invalid id path or body",
			({ userType }) => {
				const userStub = factoryUserStub(userType);

				beforeAll(async () => {
					await testService.insertStubUser(userStub);
				});
				describe.each([
					{
						testName: "deliver not existed user id",
						userId: faker.string.uuid(),
						requestUserEmail: userStub.email,
						body: {
							password: "updatedPassword",
						},
					},
					{
						testName: "deliver huge length password",
						userId: userStub.id,
						requestUserEmail: userStub.email,
						body: {
							password: Array(10)
								.fill(faker.internet.password({ length: 10 }))
								.join(),
						},
					},
					{
						testName: "deliver huge length password",
						userId: userStub.id,
						requestUserEmail: userStub.email,
						body: {
							password: "updatedPassword",
							undefinedField: "undefinedField",
						},
					},
				])("test : $testName", ({ userId, body, requestUserEmail }) => {
					let receivedRes: Awaited<ReturnType<typeof requestUpdatePassword>>;
					beforeAll(async () => {
						const header = await getOneTimeTokenHeader(
							moduleFixture,
							requestUserEmail,
							"update-password",
						);

						receivedRes = await requestUpdatePassword(userId, body, header);
					});

					it("response should match the OpenAPI documentation. doc", () => {
						expect(receivedRes.response.status).toBe(HttpStatus.BAD_REQUEST);
					});
				});
			},
		);

		describe("fail when deliver invalid oneTimeToken", () => {
			const userStubs = Array(5)
				.fill(0)
				.map(() => factoryUserStub("admin"));
			const adminStubs = Array(5)
				.fill(0)
				.map(() => factoryUserStub("user"));

			beforeAll(async () => {
				const stubs = userStubs.concat(adminStubs);
				await Promise.all(stubs.map((stub) => testService.insertStubUser(stub)));
			});
			describe.each([
				{
					testName: "request by other user",
					userId: userStubs[0].id,
					requestUserEmail: userStubs[1].email,
					body: {
						password: "updatedPassword",
					},
					expectedStatus: HttpStatus.FORBIDDEN, // result from OwnerGuard
				},
				{
					testName: "request by other admin",
					userId: userStubs[0].id,
					requestUserEmail: adminStubs[1].email,
					body: {
						password: "updatedPassword",
					},
					expectedStatus: HttpStatus.FORBIDDEN, // result from OwnerGuard
				},
				{
					testName: "deliver used oneTimeToken",
					userId: userStubs[0].id,
					requestUserEmail: userStubs[0].email,
					body: {
						password: "updatedPassword",
					},
					oneTimeTokenOption: {
						isUsed: true,
					},
					expectedStatus: HttpStatus.UNAUTHORIZED, // result from SecurityTokenGuard
				},
			])(
				"test : $testName",
				({ userId, requestUserEmail, body, oneTimeTokenOption, expectedStatus }) => {
					let receivedRes: Awaited<ReturnType<typeof requestUpdatePassword>>;
					beforeAll(async () => {
						const header = await getOneTimeTokenHeader(
							moduleFixture,
							requestUserEmail,
							"update-password",
							oneTimeTokenOption,
						);

						receivedRes = await requestUpdatePassword(userId, body, header);
					});

					it("response should match the OpenAPI documentation", () => {
						expect(receivedRes.response.status).toBe(expectedStatus);
					});
				},
			);
		});

		describe("fail when special case", () => {
			it("deliver oneTimeToken from deleted user", async () => {
				//1. arrange
				const deletedUserStub = factoryUserStub("user");
				const targetUserId = deletedUserStub.id;
				await testService.insertStubUser(deletedUserStub);
				const header = await getOneTimeTokenHeader(
					moduleFixture,
					deletedUserStub.email,
					"update-password",
				);
				const body = {
					password: "updatedPassword",
				};
				await arrangeDeletedUser(moduleFixture, deletedUserStub);

				//2. action
				const receivedRes = await requestUpdatePassword(targetUserId, body, header);

				//3. assert
				expect(receivedRes.response.status).toBe(HttpStatus.UNAUTHORIZED);
			});
		});
	});

	describe("/user/:email/username (PUT)", () => {
		// TODO: "/user/:email/username (PUT)" e2e 테스트 구현
		// - [x] 공통 로직 구현
		// - [x] 좋은 데이터 테스트
		// - [x] 나쁜 데이터 테스트 (비유효 body, 비유효 path)
		// - [x] 나쁜 데이터 테스트 (비유효 header[Authorization])
		// - [x] 특수 상황 테스트 ( 타인 관리자 사용자 시도, 타인 사용자 시도, 삭제된 관리자 시도)
		// - [ ] 특수 상황 테스트 (만료된 jwt(authorization) 전달)

		async function requestUpdateUsername(
			id: string,
			body: { username: string },
			authorization: string,
		) {
			const route = ApiPaths.UserController_replaceUsername;
			const response = await client.PUT(route, {
				params: {
					path: {
						id: id,
					},
					header: {
						authorization,
					},
				},
				body,
			});

			return response;
		}

		describe.each([{ userType: USER_ROLE.user }, { userType: USER_ROLE.admin }])(
			"success when deliver valid id path and body by $userType",
			({ userType }) => {
				const userStub = factoryUserStub(userType);
				beforeAll(async () => {
					await testService.insertStubUser(userStub);
				});
				describe.each([
					{
						testName: "deliver valid userId path and body",
						userId: userStub.id,
						body: {
							username: faker.internet.username({ firstName: "upDate" }),
						},
					},
				])("test : $testName", ({ userId, body }) => {
					let receivedRes: Awaited<ReturnType<typeof requestUpdateUsername>>;

					beforeAll(async () => {
						const user = await userService.findOne({ where: { id: userId } });
						assert(user !== null);
						const authorization = testService.getBearerAuthCredential(user);
						receivedRes = await requestUpdateUsername(userId, body, authorization);
					});

					it("response should match the OpenAPI documentation.", () => {
						expect(receivedRes.response.status).toBe(HttpStatus.OK);
						const receivedBody = receivedRes.data;
						expect(receivedBody).toBeUndefined();
					});

					it("User entity should be updated", async () => {
						const receivedUser = await userService.findOne({ where: { id: userId } });
						assert(receivedUser !== null);
						const expectedUsername = body.username;
						expect(receivedUser.username).toBe(expectedUsername);
					});
				});
			},
		);

		describe.each([{ userType: USER_ROLE.user }, { userType: USER_ROLE.admin }])(
			"fail when invalid id path or invalid body by $userType",
			({ userType }) => {
				const userStub = factoryUserStub(userType);
				beforeAll(async () => {
					await testService.insertStubUser(userStub);
				});
				describe.each([
					{
						testName: "deliver not existed id path",
						invalidId: faker.string.uuid(),
						requestUserEmail: userStub.email,
						invalidBody: {
							username: "updatedUsername",
						},
					},
					// {
					// 	testName: "deliver invalid body having not allowed characters",
					// 	invalidId: userStub.email,
					// 	requestUserEmail: userStub.email,
					// 	invalidBody: {
					// 		username: "!@#_update",
					// 	},
					// },
				])("test : $testName", ({ invalidId, invalidBody, requestUserEmail }) => {
					let receivedRes: Awaited<ReturnType<typeof requestUpdateUsername>>;

					beforeAll(async () => {
						const authorizationUser = await userService.findOne({
							where: { email: requestUserEmail },
						});
						assert(authorizationUser !== null);
						const authorization =
							testService.getBearerAuthCredential(authorizationUser);
						receivedRes = await requestUpdateUsername(
							invalidId,
							invalidBody,
							authorization,
						);
					});

					it("response should match the OpenAPI documentation.", () => {
						expect(receivedRes.response.status).toBe(HttpStatus.BAD_REQUEST);
					});
				});
			},
		);

		describe("fail when deliver invalid header[Authorization]", () => {
			const userStub = factoryUserStub("user");
			beforeAll(async () => {
				await testService.insertStubUser(userStub);
			});
			describe.each([
				{
					testName: "deliver faked authorization ",
					userId: userStub.id,
					invalidAuthorization: faker.internet.jwt(),
					body: {
						username: "updatedUsername",
					},
				},
			])("test : $testName", ({ userId, body, invalidAuthorization }) => {
				let receivedRes: Awaited<ReturnType<typeof requestUpdateUsername>>;

				beforeAll(async () => {
					receivedRes = await requestUpdateUsername(userId, body, invalidAuthorization);
				});

				it("response should match the OpenAPI documentation.", () => {
					expect(receivedRes.response.status).toBe(HttpStatus.UNAUTHORIZED);
				});
			});
		});

		describe("fail when special case for header[Authorization]", () => {
			const userStub = factoryUserStub("user");
			const otherUserStub = factoryUserStub("user");
			const adminStub = factoryUserStub("admin");
			const deletedAdminStub = factoryUserStub("admin");
			beforeAll(async () => {
				await testService.insertUserStubs([
					userStub,
					otherUserStub,
					adminStub,
					deletedAdminStub,
				]);
				await arrangeDeletedUser(moduleFixture, deletedAdminStub);
			});
			describe.each([
				{
					testName: "request by other user'",
					userId: userStub.id,
					requestUserEmail: otherUserStub.email,
					body: {
						username: "updatedUsername",
					},
				},
				{
					testName: "request by other admin",
					userId: userStub.id,
					requestUserEmail: adminStub.email,
					body: {
						username: "updatedUsername",
					},
				},
			])("test : $testName", ({ userId, body, requestUserEmail }) => {
				let receivedRes: Awaited<ReturnType<typeof requestUpdateUsername>>;

				beforeAll(async () => {
					const authorizationUser = await userService.findOne({
						where: { email: requestUserEmail },
					});
					assert(authorizationUser !== null);
					const authorization = testService.getBearerAuthCredential(authorizationUser);
					receivedRes = await requestUpdateUsername(userId, body, authorization);
				});

				it("response should match the OpenAPI documentation.", () => {
					expect(receivedRes.response.status).toBe(HttpStatus.FORBIDDEN);
				});
			});
		});
	});

	describe("/user/:email/role (PUT)", () => {
		// TODO: "/user/:email/role (PUT)" e2e 테스트 구현
		// - [x] 공통 로직 구현
		// - [x] 좋은 데이터 테스트
		// - [x] 나쁜 데이터 테스트 (비유효 body, 비유효 path)
		// - [x] 나쁜 데이터 테스트 (비유효 header authorization field)
		// - [x] 특수 상황 테스트 ( 일반 사용자가 요청, 삭제된 관리자로 요청)
		// - [ ] 특수 상황 테스트 ( 만료된 jwt(authorization) 전달달)
		async function requestUpdateUserRole(
			id: string,
			body: {
				role: USER_ROLE;
			},
			adminAuthorization: string,
		) {
			const route = ApiPaths.UserController_replaceRole;
			const response = await client.PUT(route, {
				params: {
					path: {
						id,
					},
					header: {
						authorization: adminAuthorization,
					},
				},
				body,
			});

			return response;
		}

		describe.each([{ userType: USER_ROLE.user }, { userType: USER_ROLE.admin }])(
			"success when deliver valid email path and body by $userType",
			({ userType }) => {
				const targetUserStub = factoryUserStub(userType);
				const requestUserStub = factoryUserStub("admin");

				beforeAll(async () => {
					await testService.insertStubUser(targetUserStub);
					await testService.insertStubUser(requestUserStub);
				});

				describe.each([
					{
						testName: "flip user role",
						id: targetUserStub.id,
						requestUserEmail: requestUserStub.email,
						body: {
							role: userType === USER_ROLE.user ? USER_ROLE.admin : USER_ROLE.user,
						},
					},
				])("test : $testName", ({ id, body, requestUserEmail }) => {
					let receivedRes: Awaited<ReturnType<typeof requestUpdateUserRole>>;

					beforeAll(async () => {
						const requestUser = await userService.findOne({
							where: { email: requestUserEmail },
						});
						assert(requestUser !== null);
						const authorization = testService.getBearerAuthCredential(requestUser);
						receivedRes = await requestUpdateUserRole(id, body, authorization);
					});

					it("response should match the OpenAPI documentation.", () => {
						expect(receivedRes.response.status).toBe(HttpStatus.OK);
						const receivedBody = receivedRes.data;
						expect(receivedBody).toBeUndefined();
					});

					it("user entity role field should be updated.", async () => {
						const receivedUser = await userService.findOne({
							where: { id },
						});
						const expectedRole = body.role;
						expect(receivedUser?.role).toBe(expectedRole);
					});
				});
			},
		);
		describe.each([{ userType: USER_ROLE.user }, { userType: USER_ROLE.admin }])(
			"fail when deliver invalid email path or invalid body",
			({ userType }) => {
				const targetUserStub = factoryUserStub(userType);
				const requestUserStub = factoryUserStub("admin");

				beforeAll(async () => {
					await testService.insertStubUser(targetUserStub);
					await testService.insertStubUser(requestUserStub);
				});

				describe.each([
					{
						testName: "deliver not existed user's email",
						invalidId: faker.string.uuid(),
						requestUserEmail: requestUserStub.email,
						invalidBody: {
							role: userType === USER_ROLE.user ? USER_ROLE.admin : USER_ROLE.user,
						},
					},
					{
						testName: "deliver invalid body",
						invalidId: faker.string.uuid(),
						requestUserEmail: requestUserStub.email,
						invalidBody: {
							role: "NOT_DEFINED_ROLE",
						},
					},
				])("test : $testName", ({ invalidId, invalidBody, requestUserEmail }) => {
					let receivedRes: Awaited<ReturnType<typeof requestUpdateUserRole>>;

					beforeAll(async () => {
						const requestUser = await userService.findOne({
							where: { email: requestUserEmail },
						});
						assert(requestUser !== null);
						const authorization = testService.getBearerAuthCredential(requestUser);
						receivedRes = await requestUpdateUserRole(
							invalidId,
							invalidBody as { role: USER_ROLE },
							authorization,
						);
					});

					it("response should match the OpenAPI documentation.", () => {
						expect(receivedRes.response.status).toBe(HttpStatus.BAD_REQUEST);
					});
				});
			},
		);
		describe("fail when deliver invalid header authorization field ", () => {});
		describe.each([{ userType: USER_ROLE.user }, { userType: USER_ROLE.admin }])(
			"fail when deliver invalid header[Authorization]",
			({ userType }) => {
				const targetUserStub = factoryUserStub(userType);

				beforeAll(async () => {
					await testService.insertStubUser(targetUserStub);
				});

				describe.each([
					{
						testName: "deliver faker authorization",
						email: targetUserStub.email,
						invalidAuthorization: faker.internet.jwt(),
						body: {
							role: userType === USER_ROLE.user ? USER_ROLE.admin : USER_ROLE.user,
						},
					},
				])("test : $testName", ({ email, body, invalidAuthorization }) => {
					let receivedRes: Awaited<ReturnType<typeof requestUpdateUserRole>>;

					beforeAll(async () => {
						receivedRes = await requestUpdateUserRole(
							email,
							body,
							invalidAuthorization,
						);
					});

					it("response should match the OpenAPI documentation.", () => {
						expect(receivedRes.response.status).toBe(HttpStatus.UNAUTHORIZED);
					});
				});
			},
		);

		describe.each([{ userType: USER_ROLE.user }, { userType: USER_ROLE.admin }])(
			"fail when invalid Authorization",
			({ userType }) => {
				const targetUserStub = factoryUserStub(userType);
				const requestUserStub = factoryUserStub("admin");
				const normalUserStub = factoryUserStub("user");

				beforeAll(async () => {
					await testService.insertUserStubs([
						targetUserStub,
						requestUserStub,
						normalUserStub,
					]);
				});

				describe.each([
					{
						testName: "flip role when request by normal user",
						email: targetUserStub.email,
						requestUserEmail: normalUserStub.email,
						body: {
							role: userType === USER_ROLE.user ? USER_ROLE.admin : USER_ROLE.user,
						},
					},
				])("test : $testName", ({ email, body, requestUserEmail }) => {
					let receivedRes: Awaited<ReturnType<typeof requestUpdateUserRole>>;

					beforeAll(async () => {
						const requestUser = await userService.findOne({
							where: { email: requestUserEmail },
						});
						assert(requestUser !== null);
						const authorization = testService.getBearerAuthCredential(requestUser);
						receivedRes = await requestUpdateUserRole(email, body, authorization);
					});

					it("response should match the OpenAPI documentation.", () => {
						expect(receivedRes.response.status).toBe(HttpStatus.FORBIDDEN);
					});
				});
			},
		);

		describe("fail when special case", () => {
			it.each([{ userType: USER_ROLE.user }, { userType: USER_ROLE.admin }])(
				"flip role of $userType when request by deleted user ",
				async ({ userType }) => {
					//1. arrange
					const targetUserStub = factoryUserStub("user");
					const deletedAdminStub = factoryUserStub("admin");
					const targetEmail = targetUserStub.email;
					const [, deletedAdmin] = await testService.insertUserStubs([
						targetUserStub,
						deletedAdminStub,
					]);
					const authorization = testService.getBearerAuthCredential(deletedAdmin);
					const body = {
						role: userType === USER_ROLE.user ? USER_ROLE.admin : USER_ROLE.user,
					};

					await arrangeDeletedUser(moduleFixture, deletedAdminStub);

					//2. action
					const receivedRes = await requestUpdateUserRole(
						targetEmail,
						body,
						authorization,
					);

					//3. assert
					expect(receivedRes.response.status).toBe(HttpStatus.UNAUTHORIZED);
				},
			);
		});
	});

	describe("/user/:email (DELETE)", () => {
		// TODO: "/user/:email (DELETE)" e2e 테스트 구현
		// - [x] 공통 로직 구현
		// - [x] 좋은 데이터 테스트
		// - [x] 나쁜 데이터 테스트 (비유효 body, 비유효 path)
		// - [x] 나쁜 데이터 테스트 (비유효 header authorization field)
		// - [x] 특수 상황 테스트 (타인 사용자가 요청, 타인 관리자가 요청, 삭제된 관리자가 요청,이미 사용된 oneTimeToken 전송)
		// - [x] 특수 상황 테스트 (적합한 목적이 아닌 oneTimeToken 전송)

		async function requestDeleteUser(id: string, header: HeaderOneTimeToken) {
			const route = ApiPaths.UserController_deleteUser;
			const response = await client.DELETE(route, {
				params: {
					path: {
						id,
					},
					header,
				},
			});

			return response;
		}

		describe.each([{ userType: USER_ROLE.user }, { userType: USER_ROLE.admin }])(
			"success when deliver valid email and header by $userType",
			({ userType }) => {
				const targetUserStub = factoryUserStub(userType);
				beforeAll(async () => {
					await testService.insertStubUser(targetUserStub);
				});

				describe.each([
					{
						testName: "deliver valid email and header",
						userId: targetUserStub.id,
						requestUserEmail: targetUserStub.email,
					},
				])("test : $testName", ({ userId, requestUserEmail }) => {
					let receivedRes: Awaited<ReturnType<typeof requestDeleteUser>>;

					beforeAll(async () => {
						const header = await getOneTimeTokenHeader(
							moduleFixture,
							requestUserEmail,
							"delete-account",
						);
						receivedRes = await requestDeleteUser(userId, header);
					});

					it("response should match the OpenAPI documentation.", () => {
						expect(receivedRes.response.status).toBe(HttpStatus.OK);
						const receivedBody = receivedRes.data;

						expect(receivedBody).toBeUndefined();
					});

					it("user entity should be deleted", async () => {
						const receivedUser = await userService.findOne({ where: { id: userId } });

						expect(receivedUser).toBeNull();
					});
				});
			},
		);

		describe.each([{ userType: USER_ROLE.user }, { userType: USER_ROLE.admin }])(
			"fail when deliver invalid id by $userType",
			({ userType }) => {
				const targetUserStub = factoryUserStub(userType);
				beforeAll(async () => {
					await testService.insertStubUser(targetUserStub);
				});

				describe.each([
					{
						testName: "deliver not existed user id",
						invalidId: faker.string.uuid(),
						requestUserEmail: targetUserStub.email,
					},
					{
						testName: "deliver not uuid format",
						invalidId: faker.internet.ipv4(),
						requestUserEmail: targetUserStub.email,
					},
				])("test : $testName", ({ invalidId, requestUserEmail }) => {
					let receivedRes: Awaited<ReturnType<typeof requestDeleteUser>>;

					beforeAll(async () => {
						const header = await getOneTimeTokenHeader(
							moduleFixture,
							requestUserEmail,
							"delete-account",
						);
						receivedRes = await requestDeleteUser(invalidId, header);
					});

					it("response should match the OpenAPI documentation.", () => {
						expect(receivedRes.response.status).toBe(HttpStatus.BAD_REQUEST);
					});
				});
			},
		);

		describe.each([{ userType: USER_ROLE.user }, { userType: USER_ROLE.admin }])(
			"fail when deliver invalid header",
			({ userType }) => {
				const targetUserStub = factoryUserStub(userType);
				const adminStub = factoryUserStub("admin");
				const normalUserStub = factoryUserStub("user");

				beforeAll(async () => {
					await testService.insertStubUser(targetUserStub);
					await testService.insertStubUser(adminStub);
					await testService.insertStubUser(normalUserStub);
				});

				describe.each([
					{
						testName: "request by normal user",
						userId: targetUserStub.id,
						requestUserEmail: normalUserStub.email,
						expectedHttpStatus: HttpStatus.FORBIDDEN,
					},
					{
						testName: "request by admin",
						userId: targetUserStub.id,
						requestUserEmail: adminStub.email,
						expectedHttpStatus: HttpStatus.FORBIDDEN,
					},
					{
						testName: "deliver used oneTimeToken",
						userId: targetUserStub.id,
						requestUserEmail: normalUserStub.email,
						oneTimeTokenOption: {
							isUsed: true,
						},
						expectedHttpStatus: HttpStatus.UNAUTHORIZED,
					},
				])(
					"test : $testName",
					({ userId, requestUserEmail, oneTimeTokenOption, expectedHttpStatus }) => {
						let receivedRes: Awaited<ReturnType<typeof requestDeleteUser>>;

						beforeAll(async () => {
							const header = await getOneTimeTokenHeader(
								moduleFixture,
								requestUserEmail,
								"delete-account",
								oneTimeTokenOption,
							);
							receivedRes = await requestDeleteUser(userId, header);
						});

						it("response should match the OpenAPI documentation.", () => {
							expect(receivedRes.response.status).toBe(expectedHttpStatus);
						});
					},
				);
			},
		);

		describe("fail when special case", () => {
			it("request from already deleted user", async () => {
				//1. arrange
				const deletedUserStub = factoryUserStub("user");
				const userId = deletedUserStub.id;
				await testService.insertStubUser(deletedUserStub);
				const header = await getOneTimeTokenHeader(
					moduleFixture,
					deletedUserStub.email,
					"delete-account",
				);

				await arrangeDeletedUser(moduleFixture, deletedUserStub);

				//2. action
				const receivedRes = await requestDeleteUser(userId, header);

				//3. assert
				expect(receivedRes.response.status).toBe(HttpStatus.UNAUTHORIZED);
			});

			it("deliver oneTimeToken from deleted user", async () => {
				//1. arrange
				const targetUserStub = factoryUserStub("user");
				const deletedUserStub = factoryUserStub("user");
				const userId = targetUserStub.id;
				await testService.insertUserStubs([targetUserStub, deletedUserStub]);
				const header = await getOneTimeTokenHeader(
					moduleFixture,
					deletedUserStub.email,
					"delete-account",
				);

				await arrangeDeletedUser(moduleFixture, deletedUserStub);

				//2. action
				const receivedRes = await requestDeleteUser(userId, header);

				//3. assert
				expect(receivedRes.response.status).toBe(HttpStatus.UNAUTHORIZED);
			});
		});

		it.each([{ userType: USER_ROLE.user }, { userType: USER_ROLE.admin }])(
			"fail when deliver incorrect oneTimeToken by $userType",
			async ({ userType }) => {
				const targetUser = await testService.insertStubUser(factoryUserStub(userType));
				const incorrectPurpose = "update-password";
				const header = await getOneTimeTokenHeader(
					moduleFixture,
					targetUser.email,
					incorrectPurpose,
				);

				//2.action
				const receivedRes = await requestDeleteUser(targetUser.id, header);

				//3.assert
				expect(receivedRes.response.status).toBe(HttpStatus.UNAUTHORIZED);
			},
		);
	});

	describe("/user/recover/:email (PUT)", () => {
		// TODO: "/user/recover/:email (PUT)" e2e 테스트 구현
		// - [x] 공통 로직 구현
		// - [x] 좋은 데이터 테스트
		// - [x] 나쁜 데이터 테스트 (비유효 email path)
		// - [x] 나쁜 데이터 테스트 (비유효 header authorization field)
		// - [x] 특수 상황 테스트 (타인 일반 사용자가 요청, 타인 관리자가 요청, 삭제된 사용자가 요청,이미 사용된 oneTimeToken 전달,사용자가 삭제되지 않은 상황)

		async function requestRecoverUser(id: string, header: HeaderOneTimeToken) {
			const route = ApiPaths.UserController_recoverUser;
			const response = await client.PUT(route, {
				params: {
					path: {
						id,
					},
					header,
				},
			});

			return response;
		}

		describe.each([{ userType: USER_ROLE.user }, { userType: USER_ROLE.admin }])(
			"success when deliver valid id and header by $userType",
			({ userType }) => {
				const targetUserStub = factoryUserStub(userType);

				beforeAll(async () => {
					await testService.insertStubUser(targetUserStub);
					await arrangeDeletedUser(moduleFixture, targetUserStub);
				});

				describe.each([
					{
						testName: "deliver valid id",
						userId: targetUserStub.id,
						requestUserEmail: targetUserStub.email,
					},
				])("test : $testName ", ({ userId, requestUserEmail }) => {
					let receivedRes: Awaited<ReturnType<typeof requestRecoverUser>>;

					beforeAll(async () => {
						const header = await getOneTimeTokenHeader(
							moduleFixture,
							requestUserEmail,
							"recover-account",
						);
						receivedRes = await requestRecoverUser(userId, header);
					});

					it("response should match the OpenAPI documentation.", () => {
						expect(receivedRes.response.status).toBe(HttpStatus.OK);
						const receivedBody = receivedRes.data;
						expect(receivedBody).toBeUndefined();
					});
					it("user entity should be recovered", async () => {
						const receivedUser = await userService.findOne({ where: { id: userId } });

						expect(receivedUser).toBeDefined();
					});
				});
			},
		);

		describe.each([{ userType: USER_ROLE.user }, { userType: USER_ROLE.admin }])(
			"fail when deliver invalid email path by $userType",
			({ userType }) => {
				const targetUserStub = factoryUserStub(userType);

				beforeAll(async () => {
					await testService.insertStubUser(targetUserStub);
					await arrangeDeletedUser(moduleFixture, targetUserStub);
				});

				describe.each([
					{
						testName: "deliver not existed user's id",
						userId: faker.string.uuid(),
						requestUserEmail: targetUserStub.email,
					},
					{
						testName: "deliver incorrect format",
						userId: faker.internet.jwt(),
						requestUserEmail: targetUserStub.email,
					},
				])("test : $testName ", ({ userId, requestUserEmail }) => {
					let receivedRes: Awaited<ReturnType<typeof requestRecoverUser>>;

					beforeAll(async () => {
						const header = await getOneTimeTokenHeader(
							moduleFixture,
							requestUserEmail,
							"recover-account",
						);
						receivedRes = await requestRecoverUser(userId, header);
					});

					it("response should match the OpenAPI documentation.", () => {
						expect(receivedRes.response.status).toBe(HttpStatus.BAD_REQUEST);
					});
				});
			},
		);

		describe.each([{ userType: USER_ROLE.user }, { userType: USER_ROLE.admin }])(
			"fail when deliver invalid header by $userType",
			({ userType }) => {
				const targetUserStub = factoryUserStub(userType);

				beforeAll(async () => {
					await testService.insertStubUser(targetUserStub);
					await arrangeDeletedUser(moduleFixture, targetUserStub);
				});

				describe.each([
					{
						testName: "deliver faker oneTimeToken",
						userId: targetUserStub.id,
						header: {
							"x-one-time-token-identifier": faker.string.uuid(),
							"x-one-time-token-value": faker.internet.jwt(),
						},
					},
					{
						testName: "deliver empty header",
						userId: faker.string.uuid(),
						header: {},
					},
				])("test : $testName ", ({ userId, header }) => {
					let receivedRes: Awaited<ReturnType<typeof requestRecoverUser>>;

					beforeAll(async () => {
						receivedRes = await requestRecoverUser(
							userId,
							header as HeaderOneTimeToken,
						);
					});

					it("response should match the OpenAPI documentation.", () => {
						expect(receivedRes.response.status).toBe(HttpStatus.UNAUTHORIZED);
					});
				});
			},
		);

		describe.each([{ userType: USER_ROLE.user }, { userType: USER_ROLE.admin }])(
			"fail when deliver invalid case by $userType",
			({ userType }) => {
				const targetUserStub = factoryUserStub(userType);
				const adminStub = factoryUserStub("admin");
				const userStub = factoryUserStub("user");
				const activeUserStub = factoryUserStub(userType);

				beforeAll(async () => {
					await testService.insertUserStubs([
						targetUserStub,
						adminStub,
						userStub,
						activeUserStub,
					]);
					await arrangeDeletedUser(moduleFixture, targetUserStub);
				});

				describe.each([
					{
						testName: "request by other user",
						userId: targetUserStub.id,
						requestUserEmail: userStub.email,
						expectedHttpStatus: HttpStatus.FORBIDDEN, // result from OwnerGuard
					},
					{
						testName: "request by other admin",
						userId: targetUserStub.id,
						requestUserEmail: adminStub.email,
						expectedHttpStatus: HttpStatus.FORBIDDEN, // result from OwnerGuard
					},
					{
						testName: "request by not deleted user",
						userId: activeUserStub.id,
						requestUserEmail: activeUserStub.email,
						expectedHttpStatus: HttpStatus.BAD_REQUEST, // result from OwnerGuard
					},
					{
						testName: "deliver admin oneTimeToken already used ",
						userId: targetUserStub.id,
						requestUserEmail: adminStub.email,
						oneTimeTokenOption: { isUsed: true },
						expectedHttpStatus: HttpStatus.UNAUTHORIZED, // result from securityTokenGuard
					},
				])(
					"test : $testName ",
					({ userId, requestUserEmail, oneTimeTokenOption, expectedHttpStatus }) => {
						let receivedRes: Awaited<ReturnType<typeof requestRecoverUser>>;

						beforeAll(async () => {
							const header = await getOneTimeTokenHeader(
								moduleFixture,
								requestUserEmail,
								"recover-account",
								oneTimeTokenOption,
							);
							receivedRes = await requestRecoverUser(userId, header);
						});

						it("response should match the OpenAPI documentation.", () => {
							expect(receivedRes.response.status).toBe(expectedHttpStatus);
						});
					},
				);
			},
		);

		describe("fail when special case", () => {
			it("deliver oneTimeToken from deleted user", async () => {
				//1. arrange
				const targetUserStub = factoryUserStub("user");
				const deletedUserStub = factoryUserStub("user");
				const userId = targetUserStub.id;
				await testService.insertUserStubs([targetUserStub, deletedUserStub]);
				const header = await getOneTimeTokenHeader(
					moduleFixture,
					deletedUserStub.email,
					"recover-account",
				);

				await arrangeDeletedUser(moduleFixture, targetUserStub);
				await arrangeDeletedUser(moduleFixture, deletedUserStub);

				//2. action
				const receivedRes = await requestRecoverUser(userId, header);

				//3. assert
				expect(receivedRes.response.status).toBe(HttpStatus.FORBIDDEN); // result from OwnerGuard
			});
		});
	});
});
