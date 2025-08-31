/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { HttpStatus, INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { AppModule } from "../../../src/app.module";
import { DatabaseService } from "../../../src/modules/db/db.service";
import { configNestApp } from "../../../src/app.config";
import { User } from "../../../src/modules/user/entity/user.entity";
import { CreateUserDTO } from "../../../src/modules/user/dto/request/createUser.dto";
import { ReplacePassWordDTO } from "../../../src/modules/user/dto/request/replacePw.dto";
import { TestModule } from "../../_shared/test.module";
import { TestService } from "../../_shared/test.service";
import { factoryUserStub, getAdminUserStub, getNormalUserStub } from "../../_shared/stub/user.stub";
import { faker } from "@faker-js/faker";
import createClient from "openapi-fetch";
import {
	ApiPaths,
	paths,
	ReplaceRoleDto,
	ReplaceUsernameDto,
	USER_ROLE,
	USER_STATE,
} from "../../swagger/dto-types";
import { expectResponseBody } from "../_common/jest-zod";
import { zShowUserResponse } from "./zodSchema";
import { UserService } from "../../../src/modules/user/user.service";
import { AuthService } from "../../../src/modules/auth/auth.service";

describe("UserController (e2e)", () => {
	let app: INestApplication;
	let dbService: DatabaseService;
	let testService: TestService;
	let userService: UserService;
	let authService: AuthService;
	let user: User;
	let admin: User;
	const port = 3001;
	const client = createClient<paths>({ baseUrl: `http://localhost:${port}` });
	// TODO 테스트 환경 설정하기
	// [x] nest.js APP 인스턴스 생성
	// [x] nest.js APP 인스턴스 설정(global pipe, Module, .env.test)
	// [x] 테스트 DB 연결
	// [x] 테스트 DB 데이터정의
	// [x] 테스트 DB 데이터 삽입 로직 추가
	// [x] 테스트 DB 데이터 삭제 로직
	// [x] 테스트 종료후 APP 인스턴스 종료

	beforeAll(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [AppModule, TestModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		configNestApp(app);
		await app.init();

		testService = moduleFixture.get(TestService);
		dbService = moduleFixture.get(DatabaseService);
		userService = moduleFixture.get(UserService);
		authService = moduleFixture.get(AuthService);
		await dbService.resetDB();

		user = await testService.insertStubUser(getNormalUserStub());
		admin = await testService.insertStubUser(getAdminUserStub());

		await app.listen(port);
	});

	afterAll(async () => {
		await app.close();
	});

	describe("/user/:id (GET) ", () => {
		const route = ApiPaths.UserController_getOne;
		it("/user/:id (GET) : 성공", async () => {
			const response = await client.GET(route, {
				params: {
					path: {
						id: user.id,
					},
				},
			});

			expect(response.response.status).toBe(HttpStatus.OK);
			const body = response.data!;
			expect(body).toBeDefined();
			expectResponseBody(zShowUserResponse, body);
			expect(body.id).toBe(user.id);
		});

		it("/user/:id (GET) : (실패, 삭제된 계정)", async () => {
			const deletedUser = await testService.insertStubUser(factoryUserStub("user"));
			await userService.softDeleteUser(dbService.getQueryRunner(), deletedUser.id);
			const response = await client.GET(route, {
				params: {
					path: {
						id: deletedUser.id,
					},
				},
			});

			expect(response.response.status).toBe(HttpStatus.BAD_REQUEST);
			const body = response.data!;
			expect(body).toBeFalsy();
		});
	});

	describe("/user (POST)", () => {
		const route = ApiPaths.createOneBaseUserControllerUser;
		it("/user (POST) : 성공", async () => {
			const email = faker.internet.email();
			const username = faker.internet.username();
			const password = faker.internet.password();

			const signUpToken = await testService.createSignUpOneTimeToken(email);
			const dto = {
				password,
				username,
			};
			const expected = {
				role: USER_ROLE.user,
				active: USER_STATE.active,
				email,
				username: dto.username,
			};

			const response = await client.POST(route, {
				params: {
					header: {
						"x-one-time-token-identifier": signUpToken.id,
						"x-one-time-token-value": signUpToken.token,
					},
				},
				body: dto,
			});

			expect(response.response.status).toBe(HttpStatus.CREATED);
			const body = response.data;
			expect(body).toBeDefined();
			expectResponseBody(zShowUserResponse, body);
			expect(body!).toMatchObject(expected);

			const entity = await userService.findOne({ where: { id: body!.id } });
			expect(entity).toBeDefined();
			expect(entity!).toMatchObject(expected);
		});
		it("/user (POST) : (실패, 미유효 OneTimeToken)", async () => {
			const email = faker.internet.email();
			const username = faker.internet.username();
			const password = faker.internet.password();

			const signUpToken = await testService.createSignUpOneTimeToken(email);
			const dto: CreateUserDTO = {
				password,
				username,
			};
			await testService.useOneTimeToken(signUpToken);

			const response = await client.POST(route, {
				params: {
					header: {
						"x-one-time-token-identifier": signUpToken.id,
						"x-one-time-token-value": signUpToken.token,
					},
				},
				body: dto,
			});

			expect(response.response.status).toBe(HttpStatus.UNAUTHORIZED);
			const body = response.data;
			expect(body).toBeFalsy();
			const entity = await userService.findOne({ where: { email } });
			expect(entity).toBeNull();
		});
	});

	describe("/user/:email/password", () => {
		const route = ApiPaths.UserController_replacePassword;
		it("/user/:email/password (PUT) : 성공", async () => {
			const fakerUser = await testService.insertStubUser(factoryUserStub("user"));
			const oneTimeToken = await testService.createOneTimeToken(fakerUser, "update-password");
			const dto: ReplacePassWordDTO = {
				password: faker.internet.password(),
			};

			const response = await client.PUT(route, {
				params: {
					path: {
						email: fakerUser.email,
					},
					header: {
						"x-one-time-token-identifier": oneTimeToken.id,
						"x-one-time-token-value": oneTimeToken.token,
					},
				},
				body: dto,
			});

			expect(response.response.status).toBe(HttpStatus.OK);
			const body = response.data!;
			expect(body).toBeUndefined();

			const entity = await userService.findOne({ where: { id: fakerUser.id } });
			const isChanged = await authService.isHashMatched(dto.password, entity!.password);
			expect(isChanged).toBe(true);
		});
		it("/user/:email/password (PUT) : (실패, 사용자 본인 아님)", async () => {
			const fakerUser = await testService.insertStubUser(factoryUserStub("user"));
			const adminOneTimeToken = await testService.createOneTimeToken(
				admin,
				"update-password",
			);
			const dto: ReplacePassWordDTO = {
				password: faker.internet.password(),
			};

			const response = await client.PUT(route, {
				params: {
					path: {
						email: fakerUser.email,
					},
					header: {
						"x-one-time-token-identifier": adminOneTimeToken.id,
						"x-one-time-token-value": adminOneTimeToken.token,
					},
				},
				body: dto,
			});

			expect(response.response.status).toBe(HttpStatus.FORBIDDEN);
			const body = response.data!;

			expect(body).toBeUndefined();

			const entity = await userService.findOne({ where: { id: fakerUser.id } });
			const isChanged = await authService.isHashMatched(dto.password, entity!.password);
			expect(isChanged).toBe(false);
		});
		it("/user/:email/password (PUT) : (실패, 사용자 본인이지만, 미유효 OneTimeToken)", async () => {
			const fakerUser = await testService.insertStubUser(factoryUserStub("user"));
			const usedOneTimeToken = await testService.createOneTimeToken(
				fakerUser,
				"update-password",
			);
			const dto: ReplacePassWordDTO = {
				password: faker.internet.password(),
			};
			await testService.useOneTimeToken(usedOneTimeToken);

			const response = await client.PUT(route, {
				params: {
					path: {
						email: fakerUser.email,
					},
					header: {
						"x-one-time-token-identifier": usedOneTimeToken.id,
						"x-one-time-token-value": usedOneTimeToken.token,
					},
				},
				body: dto,
			});

			expect(response.response.status).toBe(HttpStatus.UNAUTHORIZED);
			const body = response.data!;

			expect(body).toBeUndefined();
			const entity = await userService.findOne({ where: { id: fakerUser.id } });
			const isChanged = await authService.isHashMatched(dto.password, entity!.password);
			expect(isChanged).toBe(false);
		});
	});

	describe("/user/:email/username (PUT)", () => {
		const route = ApiPaths.UserController_replaceUsername;
		it("/user/:email/username (PUT) : (성공)", async () => {
			const fakerUser = await testService.insertStubUser(factoryUserStub("user"));
			const dto = {
				username: faker.internet.username(),
			};
			const authorization = testService.getBearerAuthCredential(fakerUser);

			const response = await client.PUT(route, {
				params: {
					path: {
						email: fakerUser.email,
					},
					header: {
						authorization,
					},
				},
				body: dto,
			});

			expect(response.response.status).toBe(HttpStatus.OK);
			const body = response.data!;

			expect(body).toBeUndefined();

			const entity = await userService.findOne({ where: { id: fakerUser.id } });
			expect(entity).toEqual(
				expect.objectContaining({
					username: dto.username,
					id: fakerUser.id,
					email: fakerUser.email,
					password: fakerUser.password,
				}),
			);
		});
		it("/user/:email/username (PUT) : (실패, 사용자 본인 아님)", async () => {
			const fakerUser = await testService.insertStubUser(factoryUserStub("user"));
			const dto: ReplaceUsernameDto = {
				username: faker.internet.username(),
			};
			const adminAuthorization = testService.getBearerAuthCredential(admin);

			const response = await client.PUT(route, {
				params: {
					path: {
						email: fakerUser.email,
					},
					header: {
						authorization: adminAuthorization,
					},
				},
				body: dto,
			});

			expect(response.response.status).toBe(HttpStatus.FORBIDDEN);
			const body = response.data!;

			expect(body).toBeUndefined();

			const entity = await userService.findOne({ where: { id: fakerUser.id } });
			expect(entity).toStrictEqual(
				expect.objectContaining({
					username: fakerUser.username,
					id: fakerUser.id,
					email: fakerUser.email,
					password: fakerUser.password,
					role: fakerUser.role,
				}),
			);
		});
	});

	describe("/user/:email/role", () => {
		const route = ApiPaths.UserController_replaceRole;
		it("/user/:email/role (PUT) : (성공)", async () => {
			const fakerUser = await testService.insertStubUser(factoryUserStub("user"));
			const adminAuthorization = testService.getBearerAuthCredential(admin);

			const dto: ReplaceRoleDto = {
				role: USER_ROLE.admin,
			};

			const response = await client.PUT(route, {
				params: {
					path: {
						email: fakerUser.email,
					},
					header: {
						authorization: adminAuthorization,
					},
				},
				body: dto,
			});

			expect(response.response.status).toBe(HttpStatus.OK);
			const body = response.data!;

			expect(body).toBeUndefined();

			const entity = await userService.findOne({ where: { id: fakerUser.id } });
			expect(entity).toEqual(
				expect.objectContaining({
					username: fakerUser.username,
					id: fakerUser.id,
					email: fakerUser.email,
					password: fakerUser.password,
					role: fakerUser.role,
				}),
			);
		});
		it("/user/:email/role (PUT) : (실패, 권한 없음)", async () => {
			const fakerUser = await testService.insertStubUser(factoryUserStub("user"));
			const authorization = testService.getBearerAuthCredential(fakerUser);

			const dto: ReplaceRoleDto = {
				role: USER_ROLE.admin,
			};

			const response = await client.PUT(route, {
				params: {
					path: {
						email: fakerUser.email,
					},
					header: {
						authorization,
					},
				},
				body: dto,
			});

			expect(response.response.status).toBe(HttpStatus.FORBIDDEN);
			const body = response.data!;

			expect(body).toBeUndefined();

			const entity = await userService.findOne({ where: { id: fakerUser.id } });
			expect(entity).toEqual(
				expect.objectContaining({
					username: fakerUser.username,
					id: fakerUser.id,
					email: fakerUser.email,
					password: fakerUser.password,
					role: fakerUser.role,
				}),
			);
		});
	});

	describe("/user/:email (DELETE)", () => {
		const route = ApiPaths.UserController_deleteUser;
		it("/user/:email (DELETE) : (성공)", async () => {
			const fakerUser = await testService.insertStubUser(factoryUserStub("user"));
			const oneTimeToken = await testService.createOneTimeToken(fakerUser, "delete-account");

			const response = await client.DELETE(route, {
				params: {
					path: {
						email: fakerUser.email,
					},
					header: {
						"x-one-time-token-identifier": oneTimeToken.id,
						"x-one-time-token-value": oneTimeToken.token,
					},
				},
			});

			expect(response.response.status).toBe(HttpStatus.OK);
			const body = response.data;
			expect(body).toBeUndefined();

			const entity = await userService.findOne({ where: { id: fakerUser.id } });
			expect(entity).toBeNull();
		});

		it("/user/:email (DELETE) : (실패, 사용자 본인 아님)", async () => {
			const fakerUser = await testService.insertStubUser(factoryUserStub("user"));
			const adminOneTimeToken = await testService.createOneTimeToken(admin, "delete-account");

			const response = await client.DELETE(route, {
				params: {
					path: {
						email: fakerUser.email,
					},
					header: {
						"x-one-time-token-identifier": adminOneTimeToken.id,
						"x-one-time-token-value": adminOneTimeToken.token,
					},
				},
			});

			expect(response.response.status).toBe(HttpStatus.FORBIDDEN);
			const error = response.error;
			expect(error).toBeDefined();

			const entity = await userService.findOne({ where: { id: fakerUser.id } });
			expect(entity).toBeDefined();
		});
		it("/user/:email (DELETE) : (실패, 사용자 본인이지만, 미유효 OneTimeToken)", async () => {
			const fakerUser = await testService.insertStubUser(factoryUserStub("user"));
			const usedOneTimeToken = await testService.createOneTimeToken(
				fakerUser,
				"delete-account",
			);

			await testService.useOneTimeToken(usedOneTimeToken);

			const response = await client.DELETE(route, {
				params: {
					path: {
						email: fakerUser.email,
					},
					header: {
						"x-one-time-token-identifier": usedOneTimeToken.id,
						"x-one-time-token-value": usedOneTimeToken.token,
					},
				},
			});

			expect(response.response.status).toBe(HttpStatus.UNAUTHORIZED);
			const error = response.error;
			expect(error).toBeDefined();

			const entity = await userService.findOne({ where: { id: fakerUser.id } });
			expect(entity).toBeDefined();
		});
	});

	describe("/user/recover/:email (PATCH)", () => {
		const route = ApiPaths.UserController_recoverUser;
		it("/user/recover/:email (PATCH) : (성공)", async () => {
			const fakerUser = await testService.insertStubUser(factoryUserStub("user"));
			await dbService.getRepository(User).softDelete({
				id: fakerUser.id,
			});

			const oneTimeToken = await testService.createOneTimeToken(fakerUser, "recover-account");

			const response = await client.PATCH(route, {
				params: {
					path: {
						email: fakerUser.email,
					},
					header: {
						"x-one-time-token-identifier": oneTimeToken.id,
						"x-one-time-token-value": oneTimeToken.token,
					},
				},
			});

			expect(response.response.status).toBe(HttpStatus.OK);
			const body = response.data;
			expect(body).toBeUndefined();

			const entity = await userService.findOne({ where: { id: fakerUser.id } });
			expect(entity).toBeDefined();
		});
		it("/user/recover/:email (PATCH) : (실패, 사용자 본인 아님)", async () => {
			const fakerUser = await testService.insertStubUser(factoryUserStub("user"));
			await dbService.getRepository(User).softDelete({
				id: fakerUser.id,
			});

			const adminOneTimeToken = await testService.createOneTimeToken(
				admin,
				"recover-account",
			);

			const response = await client.PATCH(route, {
				params: {
					path: {
						email: fakerUser.email,
					},
					header: {
						"x-one-time-token-identifier": adminOneTimeToken.id,
						"x-one-time-token-value": adminOneTimeToken.token,
					},
				},
			});

			expect(response.response.status).toBe(HttpStatus.FORBIDDEN);
			const error = response.error;
			expect(error).toBeDefined();

			const entity = await userService.findOne({ where: { id: fakerUser.id } });
			expect(entity).toBeNull();
		});
		it("/user/recover/:email (PATCH) : (실패, 사용자 본인이지만, 미유효 OneTimeToken)", async () => {
			const fakerUser = await testService.insertStubUser(factoryUserStub("user"));
			await dbService.getRepository(User).softDelete({
				id: fakerUser.id,
			});

			const usedOneTimeToken = await testService.createOneTimeToken(
				fakerUser,
				"recover-account",
			);
			await testService.useOneTimeToken(usedOneTimeToken);

			const response = await client.PATCH(route, {
				params: {
					path: {
						email: fakerUser.email,
					},
					header: {
						"x-one-time-token-identifier": usedOneTimeToken.id,
						"x-one-time-token-value": usedOneTimeToken.token,
					},
				},
			});

			expect(response.response.status).toBe(HttpStatus.UNAUTHORIZED);
			const error = response.error;
			expect(error).toBeDefined();
			const entity = await userService.findOne({ where: { id: fakerUser.id } });
			expect(entity).toBeNull();
		});
	});
});
