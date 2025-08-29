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
} from "../../swagger/dto-types";
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
import { type ZodObject } from "zod";

describe("AuthController (e2e)", () => {
	let app: INestApplication;
	let dbService: DatabaseService;
	let testService: TestService;
	let authService: AuthService;
	const port = 3001;
	const client = createClient<paths>({ baseUrl: `http://localhost:${port}` });

	function expectResponseBody<Z extends ZodObject>(zObject: Z, body: unknown) {
		expect(() => zObject.parse(body)).not.toThrow();
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
		await dbService.resetDB();

		await app.listen(port);
	});

	afterAll(async () => {
		await dbService.resetDB();
		await app.close();
	});

	it("/auth/sign-in (POST) : 성공  ", async () => {
		const userStub = factoryUserStub("user");
		await testService.insertStubUser(userStub);

		const res = await client.POST(ApiPaths.AuthController_signin, {
			params: {
				header: {
					authorization: testService.getBasicAuthCredential(
						userStub.email,
						userStub.password,
					),
				},
			},
		});

		expect(res.response.status).toBe(HttpStatus.CREATED);
		const body = res.data;

		expect(body).toBeTruthy();
		// expect(body).toHaveProperty("accessToken");
		// expect(body).toHaveProperty("refreshToken");
		// expect(authService.verifyToken(body!.accessToken)).toBeTruthy();

		expect(body!.user.id).toBe(userStub.id);

		expectResponseBody(zSignInResponse, body);
	});

	it("/auth/sign-in (POST) : (실패, 유효치 않은 비밀번호)  ", async () => {
		const userStub = factoryUserStub("user");
		await testService.insertStubUser(userStub);

		const res = await client.POST(ApiPaths.AuthController_signin, {
			params: {
				header: {
					authorization: testService.getBasicAuthCredential(
						userStub.email,
						userStub.password + "12",
					),
				},
			},
		});

		expect(res.response.status).toBe(HttpStatus.UNAUTHORIZED);
	});

	it("/auth/request-verification (POST) : 성공  ", async () => {
		const res = await client.POST(ApiPaths.AuthController_register, {
			body: {
				email: process.env[ENV_EMAIL_TEST_ADDRESS]!,
			},
		});

		expect(res.response.status).toBe(HttpStatus.CREATED);
		const body = res.data!;

		expect(body).toBeTruthy();

		expectResponseBody(zShowVerification, body);
	});

	it("/auth/verify (POST) : 성공  ", async () => {
		const email = process.env[ENV_EMAIL_TEST_ADDRESS]!;
		const pinCode = faker.string.sample();
		await authService.createVerification(dbService.getQueryRunner(), email, pinCode);

		const res = await client.POST(ApiPaths.AuthController_verify, {
			body: {
				email,
				pinCode,
			},
		});

		expect(res.response.status).toBe(HttpStatus.CREATED);
		const body = res.data;
		expect(body!.purpose).toBe(ONE_TIME_TOKEN_PURPOSE.sign_up);

		expectResponseBody(zShowOneTimeToken, body);
	});

	it("/auth/verify (POST) : (실패, 핀코드 미일치)  ", async () => {
		const email = process.env[ENV_EMAIL_TEST_ADDRESS]!;
		const pinCode = faker.string.sample();
		await authService.createVerification(dbService.getQueryRunner(), email, pinCode);

		const res = await client.POST(ApiPaths.AuthController_verify, {
			body: {
				email,
				pinCode: pinCode + "12",
			},
		});

		expect(res.response.status).toBe(HttpStatus.FORBIDDEN);
	});

	it("/auth/security-token (POST) : 성공  ", async () => {
		const userStub = factoryUserStub("user");
		await testService.insertStubUser(userStub);

		const res = await client.POST(ApiPaths.AuthController_generateSecurityActionToken, {
			params: {
				header: {
					authorization: testService.getBasicAuthCredential(
						userStub.email,
						userStub.password,
					),
				},
			},
			body: {
				purpose: ONE_TIME_TOKEN_PURPOSE.update_password,
			},
		});

		expect(res.response.status).toBe(HttpStatus.CREATED);
		const body = res.data;

		expect(body).toBeTruthy();
		expectResponseBody(zShowOneTimeToken, body);
	});

	it("/auth/security-token/email-verification (POST) : 성공  ", async () => {
		const user = await testService.insertStubUser(factoryUserStub("user"));

		const res = await client.POST(ApiPaths.AuthController_sendSecurityActionToken, {
			body: {
				purpose: SEND_ONE_TIME_TOKEN_PURPOSE.update_password,
				email: user.email,
			},
		});

		expect(res.response.status).toBe(HttpStatus.CREATED);
	});

	it("/auth/security-token/from-email-verification (POST) : 성공  ", async () => {
		const user = await testService.insertStubUser(factoryUserStub("user"));
		const oneTimeToken = await testService.createOneTimeToken(
			user,
			ONE_TIME_TOKEN_PURPOSE.email_verification,
		);

		const res = await client.POST(
			ApiPaths.AuthController_generateSecurityTokenByEmailVerification,
			{
				params: {
					header: {
						"x-one-time-token-identifier": oneTimeToken.id,
						"x-one-time-token-value": oneTimeToken.token,
					},
				},
				body: {
					purpose: ONE_TIME_TOKEN_PURPOSE.email_verification,
				},
			},
		);

		expect(res.response.status).toBe(HttpStatus.CREATED);
		const body = res.data;

		expect(body).toBeTruthy();
		expect(body!.purpose).toBe(ONE_TIME_TOKEN_PURPOSE.email_verification);
		expectResponseBody(zShowOneTimeToken, body);
	});

	it("/auth/security-token (GET) : 성공  ", async () => {
		const userStub = factoryUserStub("user");
		const user = await testService.insertStubUser(userStub);
		const oneTimeToken = await testService.createOneTimeToken(user, "update-password");

		const res = await client.GET(ApiPaths.AuthController_getOneTimeToken, {
			params: {
				path: {
					id: oneTimeToken.id,
				},
				header: {
					authorization: testService.getBasicAuthCredential(
						userStub.email,
						userStub.password,
					),
				},
			},
		});

		expect(res.response.status).toBe(HttpStatus.OK);
		const body = res.data;

		expect(body).toBeTruthy();
		expect(body!.purpose).toBe(SEND_ONE_TIME_TOKEN_PURPOSE.update_password);
		expectResponseBody(zHashedOneTimeToken, body);
	});
});
