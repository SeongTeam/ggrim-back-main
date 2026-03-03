import { Test, TestingModule } from "@nestjs/testing";
import { TestModule } from "../../_shared/test.module";
import { AppModule } from "../../../src/app.module";
import { configNestApp } from "../../../src/app.config";
import { HttpStatus, INestApplication } from "@nestjs/common";
import { DatabaseService } from "../../../src/modules/db/db.service";
import { TestService } from "../../_shared/test.service";
import { factoryUserStub } from "../../_shared/stub/user.stub";
import {
	ApiPaths,
	ONE_TIME_TOKEN_PURPOSE,
	paths,
	SEND_ONE_TIME_TOKEN_PURPOSE,
} from "../../openapi/dto-types";
import createClient from "openapi-fetch";
import { AuthService } from "../../../src/modules/auth/auth.service";
import { ENV_EMAIL_TEST_ADDRESS } from "../../../src/modules/_common/const/envKeys";
import { faker } from "@faker-js/faker";
import {
	zHashedOneTimeToken,
	zShowOneTimeToken,
	zShowVerification,
	zSignInResponse,
} from "./zodSchema";
import { expectResponseBody } from "../_common/jest-zod";
import { USER_ROLE } from "../../../src/modules/user/const";
import { User } from "../../../src/modules/user/entity/user.entity";
import { ShowUserResponse } from "../../../src/modules/user/dto/request/response/showUser.response";
import { UserService } from "../../../src/modules/user/user.service";
import { assert } from "console";
import { Verification } from "../../../src/modules/auth/entity/verification.entity";
import { OneTimeTokenPurpose } from "../../../src/modules/auth/types/oneTimeToken";
import { OneTimeToken } from "../../../src/modules/auth/entity/oneTimeToken.entity";
import { omit } from "../../../src/utils/object";
import { ShowOneTimeTokenResponse } from "../../../src/modules/auth/dto/response/showOneTimeToken.response";
import { ShowVerificationResponse } from "../../../src/modules/auth/dto/response/showVerfication.response";
import { HashedOneTimeTokenResponse } from "../../../src/modules/auth/dto/response/hashedOneTimeToken.response";

describe("AuthController (e2e)", () => {
	function sleep(ms: number) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
	let app: INestApplication;
	let dbService: DatabaseService;
	let testService: TestService;
	let authService: AuthService;
	let userService: UserService;
	const port = 3001;
	const client = createClient<paths>({ baseUrl: `http://localhost:${port}` });

	async function useVerifyInfo(email: string, pinCode: string) {
		const qr = dbService.getQueryRunner();
		const verification = await registerVerifyInfo(email, pinCode);
		const now = new Date();
		const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
		await authService.updateVerification(qr, verification.id, {
			last_verified_date: tenMinutesAgo,
			verification_success_date: tenMinutesAgo,
		});

		await qr.release();
	}

	async function registerVerifyInfo(email: string, pinCode: string) {
		const qr = dbService.getQueryRunner();
		const verification = await authService.createVerification(qr, email, pinCode);

		await qr.release();

		return verification;
	}

	async function deleteAllVerifications(
		condition: Partial<{
			[K in keyof Verification]: Verification[K];
		}>,
	) {
		const manager = dbService.getManager();

		await manager.delete(Verification, condition);
	}

	async function deleteAllUsers(condition: { email: string }) {
		const manager = dbService.getManager();
		const users = await manager.find(User, { where: condition });

		//delete relation table
		await Promise.all(users.map((user) => manager.delete(OneTimeToken, { user_id: user.id })));

		await manager.delete(User, condition);
	}

	async function deleteAllOneTimeTokens(
		condition: Partial<{
			[K in keyof OneTimeToken]: OneTimeToken[K];
		}>,
	) {
		const manager = dbService.getManager();

		await manager.delete(OneTimeToken, condition);
	}

	async function createOneTimeToken(userId: string, purpose: OneTimeTokenPurpose) {
		const user = await userService.findOne({ where: { id: userId } });
		assert(user !== null);
		const oneTimeToken = await testService.createOneTimeToken(user!, purpose);

		return oneTimeToken;
	}

	function expectVerification(
		receivedData: ShowVerificationResponse,
		receivedEntity: Verification,
	) {
		//TODO API 결과 DB 변경 검증하기
		//- [x] Verification Entity 생성 검증
		//- [x] 응답 객체와 DB Entity 매칭 검증

		//validate token

		const expectedData = new ShowVerificationResponse(receivedEntity);
		//validate else
		expect(receivedData).toEqual(expectedData);
	}

	async function expectOneTimeToken(
		receivedData: ShowOneTimeTokenResponse,
		receivedEntity: OneTimeToken,
	) {
		//TODO API 결과 DB 변경 검증하기
		//- [x] OneTimeToken Entity 생성 검증
		//- [x] DB에 저장된 OneTimeToken 중요 정보 암호화 검증
		//- [x] 응답 객체와 DB Entity 매칭 검증

		//validate token
		const receivedToken = receivedData.token;
		const encodedToken = receivedEntity.token;
		expect(receivedToken === encodedToken).toBe(false);
		const isMatched = await authService.isHashMatched(receivedToken, encodedToken);
		expect(isMatched).toBe(true);

		const expectedData = new ShowOneTimeTokenResponse(receivedEntity);
		//validate else
		expect(omit(receivedData, ["token"])).toEqual(omit(expectedData, ["token"]));
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
		authService = moduleFixture.get(AuthService);
		userService = moduleFixture.get(UserService);
		await dbService.resetDB();

		await app.listen(port);
	});

	afterAll(async () => {
		await dbService.resetDB();
		await app.close();
	});

	describe.each([
		{
			userType: USER_ROLE.USER,
		},
		{ userType: USER_ROLE.ADMIN },
	])("/auth/sign-in (POST) by user($userType)", ({ userType }) => {
		// TODO: "/auth/sign-in (POST)" e2e 테스트 구현
		// - [x] 공통 로직 구현
		// - [x] 좋은 데이터 테스트
		// - [x] 나쁜 데이터 테스트 (비유효 query, dto body)
		// - [ ] 특수한 상황 테이터 테스트(삭제된 계정, 존재하지 않는 아이디)

		async function requestSignIn(email: string, password: string) {
			const authorization = testService.getBasicAuthCredential(email, password);

			const res = await client.POST(ApiPaths.AuthController_signin, {
				params: {
					header: {
						authorization,
					},
				},
			});

			return res;
		}

		const userStub = factoryUserStub(userType);
		let user: User;
		beforeAll(async () => {
			user = await testService.insertStubUser(userStub);
		});
		describe("success when deliver email and password ", () => {
			describe.each([
				{
					testName: "deliver valid auth",
					email: userStub.email,
					password: userStub.password,
				},
			])("test : $testName", ({ email, password }) => {
				let receivedRes: Awaited<ReturnType<typeof requestSignIn>>;
				beforeAll(async () => {
					receivedRes = await requestSignIn(email, password);
				});

				it("response should match openapi", () => {
					expect(receivedRes.response.status).toBe(HttpStatus.CREATED);
					const receivedData = receivedRes.data;
					expect(receivedData).toBeDefined();
					expect(receivedData!.user).toEqual(new ShowUserResponse(user));
					expectResponseBody(zSignInResponse, receivedData);
				});
			});
		});

		describe("fail when deliver invalid email password ", () => {
			const notExistUserStub = factoryUserStub(userType);
			const deletedUserStub = factoryUserStub(userType);

			beforeAll(async () => {
				const deletedUser = await testService.insertStubUser(deletedUserStub);

				const qr = dbService.getQueryRunner();
				await userService.softDeleteUser(qr, deletedUser.id);
				await qr.release();
			});

			describe.each([
				{
					testName: "deliver wrong password",
					invalidEmail: userStub.email,
					invalidPassword: userStub.password + "1234",
				},
				{
					testName: "deliver wrong email",
					invalidEmail: faker.internet.email(),
					invalidPassword: userStub.password,
				},
				{
					testName: "deliver wrong email",
					invalidEmail: "",
					invalidPassword: userStub.password,
				},
				{
					testName: "deliver wrong email as number format",
					invalidEmail: 1234,
					invalidPassword: 1234,
				},
				{
					testName: "deliver not existed user email and password",
					invalidEmail: notExistUserStub.email,
					invalidPassword: notExistUserStub.password,
				},
				{
					testName: "deliver deleted user email and password",
					invalidEmail: deletedUserStub.email,
					invalidPassword: deletedUserStub.password,
				},
			])("test : $testName", ({ invalidEmail, invalidPassword }) => {
				let receivedRes: Awaited<ReturnType<typeof requestSignIn>>;
				beforeAll(async () => {
					receivedRes = await requestSignIn(
						invalidEmail as string,
						invalidPassword as string,
					);
				});

				it("response should match openapi", () => {
					expect(receivedRes.response.status).toBe(HttpStatus.UNAUTHORIZED);
					const receivedData = receivedRes.data;
					expect(receivedData).toBeUndefined();
				});
			});
		});
	});

	describe("/auth/request-verification (POST)", () => {
		// TODO: "/auth/request-verification (POST)" e2e 테스트 구현
		// - [x] 공통 로직 구현
		// - [x] 좋은 데이터 테스트
		// - [x] 나쁜 데이터 테스트 (비유효 query, dto body)
		// - [x] 이미 존재하는 계정 이메일 전송 테스트
		// - [x] 연속 요청 테스트
		async function requestVerification(email: string) {
			const ret = await client.POST(ApiPaths.AuthController_register, {
				body: {
					email,
				},
			});

			return ret;
		}
		describe("success when deliver email  ", () => {
			describe.each([
				{
					email: process.env[ENV_EMAIL_TEST_ADDRESS]!,
				},
			])("test : $testName", ({ email }) => {
				let receivedRes: Awaited<ReturnType<typeof requestVerification>>;
				beforeAll(async () => {
					await deleteAllVerifications({ email });

					receivedRes = await requestVerification(email);
				});
				it("response should match openapi", () => {
					expect(receivedRes.response.status).toBe(HttpStatus.CREATED);
					const receivedData = receivedRes.data!;

					expect(receivedData).toBeTruthy();

					expectResponseBody(zShowVerification, receivedData);
				});

				it("Verification Entity should be created", async () => {
					const receivedData = receivedRes.data!;
					const receivedEntity = await authService.findVerification({ where: { email } });

					expect(receivedEntity).toBeDefined();
					expectVerification(receivedData, receivedEntity!);
				});

				it.skip("Verification email should be sent ", () => {
					//TODO request-verification 이메일 전송 검증
					//- [ ] 이메일 송신 확인하기
					//- [ ] 이메일 수신 확인하기
					//- [ ] 이메일로 전송된 핀코드 일치 확인하기
					// ? 질문: 어떻게 이메일 전송 수신 여부를 확인하는가?
					// -> SMTP와 POP 프로토콜 또는 메세지큐를 검증하면 되지 않는가? 테스트 설계전에 모르는 정보를 조사해야한다.
				});
			});
		});
		describe("fail when deliver invalid data as email  ", () => {
			describe.each([
				{
					email: faker.person.fullName(),
				},
				{
					email: faker.string.uuid(),
				},
				{
					email: undefined,
				},
			])("test : $testName", ({ email }) => {
				let receivedRes: Awaited<ReturnType<typeof requestVerification>>;
				beforeAll(async () => {
					receivedRes = await requestVerification(email as string);
				});
				it("response should match openapi", () => {
					expect(receivedRes.response.status).toBe(HttpStatus.BAD_REQUEST);
				});

				it.skip("Verification email should be sent ", () => {
					//TODO request-verification 이메일 전송 검증
					//- [ ] 서비스 측 이메일 송신안되었는지 검증
					//- [ ] 사용자 측 이메일 수신안되었는지 검증
					// ? 질문: 어떻게 이메일 전송 수신 여부를 확인하는가?
					// -> SMTP와 POP 프로토콜 또는 메세지큐를 검증하면 되지 않는가? 테스트 설계전에 모르는 정보를 조사해야한다.
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
		])("fail when special case", ({ userType }) => {
			const userStub = factoryUserStub(userType);

			beforeAll(async () => {
				await testService.insertStubUser(userStub);
			});
			describe.each([
				{
					testName: "deliver already existed user email",
					email: userStub.email,
				},
			])("test : $testName", ({ email }) => {
				let receivedRes: Awaited<ReturnType<typeof requestVerification>>;
				beforeAll(async () => {
					receivedRes = await requestVerification(email);
				});
				it("response should match openapi", () => {
					expect(receivedRes.response.status).toBe(HttpStatus.FORBIDDEN);
				});
			});

			it.skip("Verification email should not be sent ", () => {
				//TODO request-verification 이메일 전송 검증
				//- [ ] 서비스 측 이메일 송신안되었는지 검증
				//- [ ] 사용자 측 이메일 수신안되었는지 검증
			});
		});

		describe("fail when successively request  ", () => {
			describe.each([
				{
					testName: "5 times request with delay 1000ms",
					delayMS: 1000,
					loop: 5,
				},
			])("test : $testName", ({ delayMS, loop }) => {
				const timeOutMs = 60 * 1000;
				const targetEmail = process.env[ENV_EMAIL_TEST_ADDRESS]!;
				let receivedRes: Awaited<ReturnType<typeof requestVerification>>;

				beforeAll(async () => {
					await deleteAllVerifications({ email: targetEmail });
				});
				it(
					"response should match openapi",
					async () => {
						for (let i = 0; i < loop; i++) {
							receivedRes = await requestVerification(targetEmail);
							await sleep(delayMS);
						}
						expect(receivedRes.response.status).toBe(HttpStatus.TOO_MANY_REQUESTS);
					},
					timeOutMs,
				);

				it.skip("Verification emails should be partially sent ", () => {
					//TODO request-verification 이메일 전송 검증
					//- [ ] 서비스 측 이메일이 예상 횟수만큼 전송되었는지 검증
					//- [ ] 사용자 측 이메일이 예상 횟수만큼 수신되었는지 검증
				});
			});
		});
	});
	describe("/auth/verify (POST) ", () => {
		// TODO: "/auth/request-verification (POST)" e2e 테스트 구현
		// - [x] 공통 로직 구현
		// - [x] 좋은 데이터 테스트
		// - [x] 나쁜 데이터 테스트 (비유효 dto body)
		// - [x] 특수 상황 : 비유효 pin code 전달 연속 요청
		// - [ ] 특수 상황 : 이미 존재하는 사용자 이메일 전달
		async function requestVerify(body: { email: string; pinCode: string }) {
			const res = await client.POST(ApiPaths.AuthController_verify, {
				body,
			});

			return res;
		}

		describe("success when deliver body", () => {
			const pinCodeSize = 8;

			describe.each([
				{
					testName: "deliver valid email and pin code",
					body: {
						email: faker.internet.email(),
						pinCode: faker.string.numeric(pinCodeSize),
					},
				},
			])("test : $testName", ({ body }) => {
				let receivedRes: Awaited<ReturnType<typeof requestVerify>>;
				beforeAll(async () => {
					await registerVerifyInfo(body.email, body.pinCode);
					receivedRes = await requestVerify(body);
				});

				it("response should match openapi doc", () => {
					expect(receivedRes.response.status).toBe(HttpStatus.CREATED);
					const receivedData = receivedRes.data!;
					expect(receivedData.purpose).toBe(ONE_TIME_TOKEN_PURPOSE.sign_up);

					expectResponseBody(zShowOneTimeToken, receivedData);
				});

				it("entity should be created in DB", async () => {
					const receivedData = receivedRes.data!;

					const receivedEntity = await authService.findOneTimeToken({
						where: { id: receivedData.id },
					});
					expect(receivedEntity).toBeDefined();
					await expectOneTimeToken(receivedData, receivedEntity!);
				});
			});
		});

		describe("fail when deliver invalid body expect Bad Request status", () => {
			//TODO : 나쁜 데이터 테스트 케이스 구현
			//- [x] 이미 계정이 생성된 이메일 전달됨
			//- [x] Verification이 생성되지 않은 email이 전달됨
			//- [ ] 이미 사용된 핀코드 전달
			//- [ ] 만료된 핀코드 전달됨
			const pinCodeSize = 8;
			const targetEmail = faker.internet.email();
			const targetPinCode = faker.string.alphanumeric(pinCodeSize);
			const usedEmail = faker.internet.email();
			const usedPinCode = faker.string.alphanumeric(pinCodeSize);
			beforeAll(async () => {
				await registerVerifyInfo(targetEmail, targetPinCode);
				await useVerifyInfo(usedEmail, usedPinCode);
			});

			describe.each([
				{
					testName: "deliver empty",
					inValidBody: {},
				},
				{
					testName: "deliver invalid pin code",
					inValidBody: {
						email: targetEmail,
						pinCode: faker.string.alphanumeric(pinCodeSize),
					},
				},
				{
					testName: "deliver invalid email",
					inValidBody: {
						email: faker.internet.email(),
						pinCode: targetPinCode,
					},
				},
				{
					testName: "deliver invalid email",
					inValidBody: {
						email: faker.internet.email(),
						pinCode: targetPinCode,
					},
				},
				{
					testName: "deliver used email and pinCode",
					inValidBody: {
						email: usedEmail,
						pinCode: usedPinCode,
					},
				},
				{
					testName: "deliver exist user's email",
					inValidBody: {
						email: faker.internet.email(),
						pinCode: targetPinCode,
					},
				},
			])("test : $testName", ({ inValidBody }) => {
				let receivedRes: Awaited<ReturnType<typeof requestVerify>>;
				beforeAll(async () => {
					receivedRes = await requestVerify(
						inValidBody as { email: string; pinCode: string },
					);
				});

				it("response should match openapi doc", () => {
					expect(receivedRes.response.status).toBe(HttpStatus.BAD_REQUEST);
					const receivedData = receivedRes.data!;
					expect(receivedData).toBeUndefined();
				});
			});
		});

		describe("fail when deliver valid body after repeat fail within invalid body", () => {
			const pinCodeSize = 8;
			const targetEmail = faker.internet.email();
			const targetPinCode = faker.string.alphanumeric(pinCodeSize);
			const timeOutMs = 60 * 1000;
			beforeEach(async () => {
				await registerVerifyInfo(targetEmail, targetPinCode);
				console.log("beforeEach");
			});

			afterEach(async () => {
				await deleteAllVerifications({ email: targetEmail });
			});

			describe.each([
				{
					testName: "repeat fail 5 times delay 1000ms",
					repeat: 5,
					delayMs: 1000,
				},
				{
					testName: "repeat fail 5 times delay 10_000ms",
					repeat: 5,
					delayMs: 10 * 1000,
				},
			])("test : $testName", ({ repeat, delayMs }) => {
				let receivedRes: Awaited<ReturnType<typeof requestVerify>>;

				it(
					"response should match openapi doc",
					async () => {
						for (let i = 0; i < repeat; i++) {
							const invalidPinCode = faker.string.alphanumeric(pinCodeSize);
							receivedRes = await requestVerify({
								email: targetEmail,
								pinCode: invalidPinCode,
							});
							// expect(receivedRes.response.status).toBe(HttpStatus.BAD_REQUEST);
							await sleep(delayMs);
						}
						receivedRes = await requestVerify({
							email: targetEmail,
							pinCode: targetPinCode,
						});
						expect(receivedRes.response.status).toBe(HttpStatus.TOO_MANY_REQUESTS);
						const receivedData = receivedRes.data!;
						expect(receivedData).toBeUndefined();
					},
					timeOutMs,
				);
			});
		});
	});

	describe("/auth/security-token (POST)  ", () => {
		// TODO: "/auth/security-token (POST)" e2e 테스트 구현
		// - [x] 공통 로직 구현
		// - [x] 좋은 데이터 테스트
		// - [x] 나쁜 데이터 테스트 (비유효 dto body,)
		// - [x] 나쁜 데이터 테스트 (비유효 user 정보)
		// - [ ] 특수 상황 :
		async function requestSecurityToken(
			email: string,
			password: string,
			body: {
				purpose: ONE_TIME_TOKEN_PURPOSE;
			},
		) {
			const authorization = testService.getBasicAuthCredential(email, password);
			const res = await client.POST(ApiPaths.AuthController_generateSecurityActionToken, {
				params: {
					header: {
						authorization,
					},
				},
				body,
			});
			return res;
		}

		describe.each([{ userType: USER_ROLE.USER }, { userType: USER_ROLE.ADMIN }])(
			"success when valid user info and body",
			({ userType }) => {
				const userStub = factoryUserStub(userType);
				beforeAll(async () => {
					await testService.insertStubUser(userStub);
				});

				describe.each([
					{
						testName: "deliver body delete_account",
						email: userStub.email,
						password: userStub.password,
						body: {
							purpose: ONE_TIME_TOKEN_PURPOSE.delete_account,
						},
					},
					{
						testName: "deliver body email_verification",
						email: userStub.email,
						password: userStub.password,
						body: {
							purpose: ONE_TIME_TOKEN_PURPOSE.email_verification,
						},
					},
					{
						testName: "deliver body magic_login",
						email: userStub.email,
						password: userStub.password,
						body: {
							purpose: ONE_TIME_TOKEN_PURPOSE.magic_login,
						},
					},
					{
						testName: "deliver body sign_up",
						email: userStub.email,
						password: userStub.password,
						body: {
							purpose: ONE_TIME_TOKEN_PURPOSE.sign_up,
						},
					},
					{
						testName: "deliver body update_password",
						email: userStub.email,
						password: userStub.password,
						body: {
							purpose: ONE_TIME_TOKEN_PURPOSE.update_password,
						},
					},
				])("test : $testName", ({ email, password, body }) => {
					let receivedRes: Awaited<ReturnType<typeof requestSecurityToken>>;
					beforeAll(async () => {
						receivedRes = await requestSecurityToken(email, password, body);
					});
					it("response should match openapi doc", () => {
						expect(receivedRes.response.status).toBe(HttpStatus.CREATED);
						const receivedData = receivedRes.data;
						expect(receivedData).toBeTruthy();
						expectResponseBody(zShowOneTimeToken, receivedData);
					});

					it("entity should be created in DB", async () => {
						const receivedData = receivedRes.data!;

						const receivedEntity = await authService.findOneTimeToken({
							where: { id: receivedData.id },
						});
						expect(receivedEntity).toBeDefined();
						await expectOneTimeToken(receivedData, receivedEntity!);
					});
				});
			},
		);
		describe.each([{ userType: USER_ROLE.USER }, { userType: USER_ROLE.ADMIN }])(
			"fail when deliver invalid body",
			({ userType }) => {
				//TODO : 나쁜 데이터
				const userStub = factoryUserStub(userType);
				beforeAll(async () => {
					await testService.insertStubUser(userStub);
				});

				describe.each([
					{
						testName: "deliver empty body ",
						email: userStub.email,
						password: userStub.password,
						invalidBody: {},
					},
					{
						testName: "deliver invalid body ",
						email: userStub.email,
						password: userStub.password,
						invalidBody: {
							purpose: "invalid-purpose",
						},
					},
				])("test : $testName", ({ email, password, invalidBody }) => {
					let receivedRes: Awaited<ReturnType<typeof requestSecurityToken>>;
					beforeAll(async () => {
						receivedRes = await requestSecurityToken(
							email,
							password,
							invalidBody as { purpose: ONE_TIME_TOKEN_PURPOSE },
						);
					});
					it("response should match openapi doc", () => {
						expect(receivedRes.response.status).toBe(HttpStatus.BAD_REQUEST);
						const receivedData = receivedRes.data;
						expect(receivedData).toBeUndefined();
					});
				});
			},
		);

		describe.each([{ userType: USER_ROLE.USER }, { userType: USER_ROLE.ADMIN }])(
			"fail when deliver invalid auth",
			({ userType }) => {
				const userStub = factoryUserStub(userType);
				const deletedUserStub = factoryUserStub(userType);
				const notExistUserStub = factoryUserStub(userType);
				beforeAll(async () => {
					await testService.insertStubUser(userStub);

					const deletedUser = await testService.insertStubUser(deletedUserStub);
					const qr = dbService.getQueryRunner();
					await userService.softDeleteUser(qr, deletedUser.id);
					await qr.release();
				});

				describe.each([
					{
						testName: "deliver invalid password",
						invalidEmail: userStub.email,
						invalidPassword: userStub.password + "invalid-password",
						body: { purpose: ONE_TIME_TOKEN_PURPOSE.delete_account },
					},
					{
						testName: "deliver invalid email",
						invalidEmail: userStub.email + "invalid-email",
						invalidPassword: userStub.password,
						body: { purpose: ONE_TIME_TOKEN_PURPOSE.delete_account },
					},
					{
						testName: "deliver deleted user info",
						invalidEmail: deletedUserStub.email,
						invalidPassword: deletedUserStub.password,
						body: { purpose: ONE_TIME_TOKEN_PURPOSE.delete_account },
					},
					{
						testName: "deliver not existed user info",
						invalidEmail: notExistUserStub.email,
						invalidPassword: notExistUserStub.password,
						body: { purpose: ONE_TIME_TOKEN_PURPOSE.delete_account },
					},
				])("test : $testName", ({ invalidEmail, invalidPassword, body }) => {
					let receivedRes: Awaited<ReturnType<typeof requestSecurityToken>>;
					beforeAll(async () => {
						receivedRes = await requestSecurityToken(
							invalidEmail,
							invalidPassword,
							body,
						);
					});
					it("response should match openapi doc", () => {
						expect(receivedRes.response.status).toBe(HttpStatus.UNAUTHORIZED);
						const receivedData = receivedRes.data;
						expect(receivedData).toBeUndefined();
					});
				});
			},
		);
	});

	describe("/auth/security-token/email-verification (POST)  ", () => {
		//TODO /auth/security-token/email-verification 테스트 구현
		//- [x] 좋은 데이터 테스트
		//- [x] 나쁜 데이터 테스트 ( 비유효 body)
		//- [ ] 특수 상항 데이터 테스트( 삭제된 계정 테스트)

		async function requestSecurityTokenEmailVerification(body: {
			email: string;
			purpose: SEND_ONE_TIME_TOKEN_PURPOSE;
		}) {
			const res = await client.POST(ApiPaths.AuthController_sendSecurityActionToken, {
				body,
			});
			return res;
		}

		describe.each([{ userType: USER_ROLE.USER }, { userType: USER_ROLE.ADMIN }])(
			"success when deliver valid body",
			({ userType }) => {
				const targetEmail = process.env[ENV_EMAIL_TEST_ADDRESS]!;
				const userStub = factoryUserStub(userType);
				userStub.email = targetEmail;

				async function arrange() {
					await deleteAllUsers({ email: targetEmail });
					await testService.insertStubUser(userStub);
				}

				describe.each([
					{
						testName: "deliver body with purpose update_password ",
						body: {
							email: userStub.email,
							purpose: SEND_ONE_TIME_TOKEN_PURPOSE.update_password,
						},
					},
					{
						testName: "deliver body with purpose recover_account ",
						body: {
							email: userStub.email,
							purpose: SEND_ONE_TIME_TOKEN_PURPOSE.recover_account,
						},
					},
				])("test : $testName", ({ body }) => {
					let receivedRes: Awaited<
						ReturnType<typeof requestSecurityTokenEmailVerification>
					>;
					beforeAll(async () => {
						await arrange();
						receivedRes = await requestSecurityTokenEmailVerification(body);
					});

					it("response should match openapi doc", () => {
						expect(receivedRes.response.status).toBe(HttpStatus.CREATED);
					});

					it("OneTimeToken entity should be created", async () => {
						//check testEmail.
						const receivedEntity = await authService.findOneTimeToken({
							where: { email: body.email },
						});

						expect(receivedEntity).toBeDefined();
						const receivedPurpose = receivedEntity?.purpose;
						const expectedPurpose = ONE_TIME_TOKEN_PURPOSE.email_verification;

						//TODO API 테스트 자동화 구현하기
						//[ ] 이메일 전송 결과와 DB에 저장된 결과 검증하기
						expect(receivedPurpose).toBe(expectedPurpose);
					});

					it.skip("email should be sent to body.email", async () => {
						//check testEmail.
					});
				});
			},
		);

		describe.each([{ userType: USER_ROLE.USER }, { userType: USER_ROLE.ADMIN }])(
			"fail when deliver invalid body",
			({ userType }) => {
				//TODO 나쁜 데이터 테스트
				//- [x] 빈 객체 body 데이터
				//- [x] 비유효 purpose 데이터
				//- [x] 존재하지 않는 사용자 이메일 데이터
				const targetEmail = process.env[ENV_EMAIL_TEST_ADDRESS]!;
				const userStub = factoryUserStub(userType);
				const notExistUserStub = factoryUserStub(userType);
				userStub.email = targetEmail;

				async function arrange() {
					await deleteAllOneTimeTokens({ email: targetEmail });
					await deleteAllUsers({ email: targetEmail });
					await testService.insertStubUser(userStub);
				}

				describe.each([
					{
						testName: "deliver empty body",
						invalidBody: {},
					},
					{
						testName: "deliver invalid purpose",
						invalidBody: {
							email: userStub.email,
							purpose: "invalid",
						},
					},
					{
						testName: "deliver not exist user's email",
						invalidBody: {
							email: notExistUserStub.email,
							purpose: SEND_ONE_TIME_TOKEN_PURPOSE.recover_account,
						},
					},
				])("test : $testName", ({ invalidBody }) => {
					let receivedRes: Awaited<
						ReturnType<typeof requestSecurityTokenEmailVerification>
					>;
					beforeAll(async () => {
						await arrange();
						receivedRes = await requestSecurityTokenEmailVerification(
							invalidBody as {
								email: string;
								purpose: SEND_ONE_TIME_TOKEN_PURPOSE;
							},
						);
					});

					it("response should match openapi doc", () => {
						expect(receivedRes.response.status).toBe(HttpStatus.BAD_REQUEST);
					});

					it("OneTimeToken entity should not be created", async () => {
						if (invalidBody.email) {
							const receivedEntity = await authService.findOneTimeToken({
								where: { email: invalidBody.email },
							});

							expect(receivedEntity).toBeNull();
						}
					});

					it.skip("email should not be sent to body.email", async () => {
						//check testEmail.
					});
				});
			},
		);

		describe.each([{ userType: USER_ROLE.USER }, { userType: USER_ROLE.ADMIN }])(
			"success when deliver deleted User info",
			({ userType }) => {
				const targetEmail = process.env[ENV_EMAIL_TEST_ADDRESS]!;
				const deletedUserStub = factoryUserStub(userType);
				deletedUserStub.email = targetEmail;

				beforeAll(async () => {
					//set-up test environment
					await deleteAllOneTimeTokens({ email: targetEmail });
					await deleteAllUsers({ email: targetEmail });

					const deletedUser = await testService.insertStubUser(deletedUserStub);

					const qr = dbService.getQueryRunner();
					await userService.softDeleteUser(qr, deletedUser.id);
					await qr.release();
				});

				describe.each([
					{
						testName: "deliver body purpose recover_account ",
						body: {
							email: deletedUserStub.email,
							purpose: SEND_ONE_TIME_TOKEN_PURPOSE.recover_account,
						},
					},
					{
						testName: "deliver body purpose update_password ",
						body: {
							email: deletedUserStub.email,
							purpose: SEND_ONE_TIME_TOKEN_PURPOSE.update_password,
						},
					},
				])("test : $testName", ({ body }) => {
					let receivedRes: Awaited<
						ReturnType<typeof requestSecurityTokenEmailVerification>
					>;
					beforeAll(async () => {
						receivedRes = await requestSecurityTokenEmailVerification(body);
					});

					it("response should match openapi doc", () => {
						expect(receivedRes.response.status).toBe(HttpStatus.CREATED);
					});

					it("OneTimeToken entity should be created", async () => {
						const receivedEntity = await authService.findOneTimeToken({
							where: { email: body.email },
						});

						expect(receivedEntity).toBeDefined();
						const receivedPurpose = receivedEntity?.purpose;
						const expectedPurpose = ONE_TIME_TOKEN_PURPOSE.email_verification;

						expect(receivedPurpose).toBe(expectedPurpose);
					});

					it.skip("email should be sent to body.email", async () => {
						//check testEmail.
					});
				});
			},
		);
	});

	describe("/auth/security-token/from-email-verification (POST) : 성공  ", () => {
		//TODO /auth/security-token/from-email-verification 테스트 구현
		//- [ ] 좋은 데이터 테스트
		//- [ ] 나쁜 데이터 테스트
		//- [ ] 특수 상황 : 유효치 않은 oneTimeToken 사용
		//- [ ] 특수 상황 : DB에 없는 oneTimeToken 사용
		//- [ ] 특수 상황 : 기한 만료된 oneTimeToken 사용
		//? 질문: 동작과 데이터 기반으로 테스트 구조를 설정하려면, 테스트 케이스 외부에서 oneTimeToken 데이터 추가 및 삭제하도록 stub를 만들어야하는가?

		async function requestSecurityTokenFromEmailVerification(
			header: {
				"x-one-time-token-value": string;
				"x-one-time-token-identifier": string;
			},
			body: {
				purpose: ONE_TIME_TOKEN_PURPOSE;
			},
		) {
			const res = await client.POST(
				ApiPaths.AuthController_generateSecurityTokenByEmailVerification,
				{
					params: {
						header,
					},
					body,
				},
			);

			return res;
		}

		async function initOneTimeTokenFromEmailVerification(user: User) {
			const oneTimeToken = await createOneTimeToken(user.id, "email-verification");
			return oneTimeToken;
		}

		describe.each([{ userType: USER_ROLE.USER }, { userType: USER_ROLE.ADMIN }])(
			"success when deliver valid header and body",
			({ userType }) => {
				const userStub = factoryUserStub(userType);

				beforeAll(async () => {
					await testService.insertStubUser(userStub);
				});

				describe.each([
					{
						testName: "deliver valid header and body",
						userId: userStub.id,
						body: {
							purpose: ONE_TIME_TOKEN_PURPOSE.update_password,
						},
					},
				])("test : $testName", ({ userId, body }) => {
					let receivedRes: Awaited<
						ReturnType<typeof requestSecurityTokenFromEmailVerification>
					>;
					beforeAll(async () => {
						const user = await userService.findOne({ where: { id: userId } });

						assert(user !== null);
						const oneTimeToken = await initOneTimeTokenFromEmailVerification(user!);
						const header = {
							"x-one-time-token-value": oneTimeToken.token,
							"x-one-time-token-identifier": oneTimeToken.id,
						};

						receivedRes = await requestSecurityTokenFromEmailVerification(header, body);
					});

					it("response should match openapi doc", () => {
						expect(receivedRes.response.status).toBe(HttpStatus.CREATED);
						const receivedData = receivedRes.data;

						expect(receivedData).toBeTruthy();
						expect(receivedData!.purpose).toBe(body.purpose);
						expectResponseBody(zShowOneTimeToken, receivedData);
					});

					it("entity should be created in DB", async () => {
						const receivedData = receivedRes.data!;

						const receivedEntity = await authService.findOneTimeToken({
							where: { id: receivedData.id },
						});
						expect(receivedEntity).toBeDefined();

						await expectOneTimeToken(receivedData, receivedEntity!);
					});
				});
			},
		);

		describe.each([{ userType: USER_ROLE.USER }, { userType: USER_ROLE.ADMIN }])(
			"fail when deliver invalid body",
			({ userType }) => {
				//TODO 잘못된 데이터 테스트 구현
				//- [x] 비유효 body purpose 데이터
				//- [x] 비유효 body empty object 데이터
				const userStub = factoryUserStub(userType);
				beforeAll(async () => {
					await testService.insertStubUser(userStub);
				});

				describe.each([
					{
						testName: "deliver invalid purpose",
						userId: userStub.id,
						inValidBody: {
							purpose: "invalid value",
						},
					},
					{
						testName: "deliver empty body",
						userId: userStub.id,
						inValidBody: {},
					},
				])("test : $testName", ({ userId, inValidBody }) => {
					let receivedRes: Awaited<
						ReturnType<typeof requestSecurityTokenFromEmailVerification>
					>;
					beforeAll(async () => {
						const user = await userService.findOne({ where: { id: userId } });

						assert(user !== null);
						const oneTimeToken = await initOneTimeTokenFromEmailVerification(user!);
						const header = {
							"x-one-time-token-value": oneTimeToken.token,
							"x-one-time-token-identifier": oneTimeToken.id,
						};

						receivedRes = await requestSecurityTokenFromEmailVerification(
							header,
							inValidBody as {
								purpose: ONE_TIME_TOKEN_PURPOSE;
							},
						);
					});

					it("response should match openapi doc", () => {
						expect(receivedRes.response.status).toBe(HttpStatus.BAD_REQUEST);
						const receivedData = receivedRes.data;

						expect(receivedData).toBeUndefined();
					});
				});
			},
		);
	});

	describe("/auth/security-token (GET) ", () => {
		//TODO /auth/security-token (GET)  테스트 구현
		//- [x] 공통 로직 생성
		//- [x] 좋은 데이터 테스트
		//- [ ] 나쁜 데이터 테스트
		//? 잘문 :oneTimeToken을 테스트 코드(beforeAll, test ...) 외부에서 조작할 수 있도록 서비스 로직을 수정해야하는가?
		// -> api 동작과 데이터 기반으로 테스트 하기 위해선, 위 조건이필요하다.

		async function requestGetSecurityToken(
			auth: {
				email: string;
				password: string;
			},
			oneTimeTokenId: string,
		) {
			const authorization = testService.getBasicAuthCredential(auth.email, auth.password);
			const res = await client.GET(ApiPaths.AuthController_getOneTimeToken, {
				params: {
					path: {
						id: oneTimeTokenId,
					},
					header: {
						authorization,
					},
				},
			});
			return res;
		}

		describe.each([{ userType: USER_ROLE.USER }, { userType: USER_ROLE.ADMIN }])(
			"success when request with valid id",
			({ userType }) => {
				let receivedRes: Awaited<ReturnType<typeof requestGetSecurityToken>>;
				let receivedEntity: OneTimeToken;
				beforeAll(async () => {
					const userStub = factoryUserStub(userType);
					const user = await testService.insertStubUser(userStub);
					const oneTimeToken = await testService.createOneTimeToken(
						user,
						"update-password",
					);
					receivedEntity = (await authService.findOneTimeToken({
						where: { id: oneTimeToken.id },
					}))!;
					assert(receivedEntity !== null);

					receivedRes = await requestGetSecurityToken({ ...userStub }, receivedEntity.id);
				});

				it("response should match openapi", () => {
					expect(receivedRes.response.status).toBe(HttpStatus.OK);
					const receivedData = receivedRes.data;

					expect(receivedData).toBeDefined();
					expectResponseBody(zHashedOneTimeToken, receivedData);
					expect(receivedData!).toEqual(new HashedOneTimeTokenResponse(receivedEntity));
				});
			},
		);
	});
});
