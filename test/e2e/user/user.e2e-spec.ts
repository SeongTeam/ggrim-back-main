/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { HttpStatus, INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { AppModule } from "../../../src/app.module";

import * as request from "supertest";
import { DatabaseService } from "../../../src/modules/db/db.service";
import { configNestApp } from "../../../src/app.config";
import { User } from "../../../src/modules/user/entity/user.entity";
import { ShowUserResponse } from "../../../src/modules/user/dto/request/response/showUser.response";
import { CreateUserDTO } from "../../../src/modules/user/dto/request/createUser.dto";
import { ONE_TIME_TOKEN_HEADER } from "../../../src/modules/auth/guard/const";
import { USER_ROLE, USER_STATE } from "../../../src/modules/user/const";
import { ReplacePassWordDTO } from "../../../src/modules/user/dto/request/replacePw.dto";
import { ReplaceRoleDTO } from "../../../src/modules/user/dto/request/replaceRole.dto";
import { TestModule } from "../../_shared/test.module";
import { TestService } from "../../_shared/test.service";
import { factoryUserStub, getAdminUserStub, getNormalUserStub } from "../../_shared/stub/user.stub";
import { faker } from "@faker-js/faker";

describe("UserController (e2e)", () => {
	let app: INestApplication;
	let dbService: DatabaseService;
	let testService: TestService;
	let user: User;
	let admin: User;
	// TODO 테스트 환경 설정하기
	// [ ] nest.js APP 인스턴스 생성
	// [ ] nest.js APP 인스턴스 설정(global pipe, Module, .env.test)
	// [ ] 테스트 DB 연결
	// [ ] 테스트 DB 데이터정의
	// [ ] 테스트 DB 데이터 삽입 로직 추가
	// [ ] 테스트 DB 데이터 삭제 로직
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
		await dbService.resetDB();

		user = await testService.insertStubUser(getNormalUserStub());
		admin = await testService.insertStubUser(getAdminUserStub());
	});

	afterAll(async () => {
		await dbService.resetDB();
		await app.close();
	});

	it("/user/:id (GET) : 성공", async () => {
		const response = await request(app.getHttpServer())
			.get(`/user/${user.id}`)
			.expect(HttpStatus.OK);
		const body = response.body as ShowUserResponse;
		expect(body).toBeDefined();
		expect(body).toMatchObject({
			id: user.id,
			username: user.username,
		});
	});

	it("/user (POST) : 성공", async () => {
		const email = faker.internet.email();
		const username = faker.internet.username();
		const password = faker.internet.password();

		const signUpToken = await testService.createSignUpOneTimeToken(email);
		const dto: CreateUserDTO = {
			password,
			username,
		};

		const response = await request(app.getHttpServer())
			.post("/user")
			.set(ONE_TIME_TOKEN_HEADER.X_ONE_TIME_TOKEN, signUpToken.token)
			.set(ONE_TIME_TOKEN_HEADER.X_ONE_TIME_TOKEN_ID, signUpToken.id)
			.send(dto)
			.expect(HttpStatus.CREATED);

		expect(response.body as ShowUserResponse).toMatchObject({
			role: USER_ROLE.USER,
			active: USER_STATE.ACTIVE,
			email,
			username: dto.username,
		});
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

		await request(app.getHttpServer())
			.post("/user")
			.set(ONE_TIME_TOKEN_HEADER.X_ONE_TIME_TOKEN, signUpToken.token)
			.set(ONE_TIME_TOKEN_HEADER.X_ONE_TIME_TOKEN_ID, signUpToken.id)
			.send(dto)
			.expect(HttpStatus.UNAUTHORIZED);
	});

	it("/user/:email/password (PUT) : 성공", async () => {
		const fakerUser = await testService.insertStubUser(factoryUserStub("user"));
		const oneTimeToken = await testService.createOneTimeToken(fakerUser, "update-password");
		const dto: ReplacePassWordDTO = {
			password: faker.internet.password(),
		};

		const response = await request(app.getHttpServer())
			.put(`/user/${fakerUser.email}/password`)
			.set(ONE_TIME_TOKEN_HEADER.X_ONE_TIME_TOKEN, oneTimeToken.token)
			.set(ONE_TIME_TOKEN_HEADER.X_ONE_TIME_TOKEN_ID, oneTimeToken.id)
			.send(dto)
			.expect(HttpStatus.OK);

		expect(response.body).toBeUndefined();
	});
	it("/user/:email/password (PUT) : (실패, 사용자 본인 아님)", async () => {
		const fakerUser = await testService.insertStubUser(factoryUserStub("user"));
		const adminOneTimeToken = await testService.createOneTimeToken(admin, "update-password");
		const dto: ReplacePassWordDTO = {
			password: faker.internet.password(),
		};

		await request(app.getHttpServer())
			.put(`/user/${fakerUser.email}/password`)
			.set(ONE_TIME_TOKEN_HEADER.X_ONE_TIME_TOKEN, adminOneTimeToken.token)
			.set(ONE_TIME_TOKEN_HEADER.X_ONE_TIME_TOKEN_ID, adminOneTimeToken.id)
			.send(dto)
			.expect(HttpStatus.FORBIDDEN);
	});
	it("/user/:email/password (PUT) : (실패, 사용자 본인이지만, 미유효 OneTimeToken)", async () => {
		const fakerUser = await testService.insertStubUser(factoryUserStub("user"));
		const usedOneTimeToken = await testService.createOneTimeToken(fakerUser, "update-password");
		const dto: ReplacePassWordDTO = {
			password: faker.internet.password(),
		};
		await testService.useOneTimeToken(usedOneTimeToken);

		await request(app.getHttpServer())
			.put(`/user/${fakerUser.email}/password`)
			.set(ONE_TIME_TOKEN_HEADER.X_ONE_TIME_TOKEN, usedOneTimeToken.token)
			.set(ONE_TIME_TOKEN_HEADER.X_ONE_TIME_TOKEN_ID, usedOneTimeToken.id)
			.send(dto)
			.expect(HttpStatus.FORBIDDEN);
	});

	it("/user/:email/email (PUT) : (성공)", async () => {
		const fakerUser = await testService.insertStubUser(factoryUserStub("user"));
		const dto: ReplacePassWordDTO = {
			password: faker.internet.username(),
		};
		const accessToken = testService.getAccessToken(fakerUser);

		const response = await request(app.getHttpServer())
			.put(`/user/${user.email}/email`)
			.auth(accessToken, { type: "bearer" })
			.send(dto)
			.expect(HttpStatus.OK);

		expect(response.body).toBeUndefined();
	});
	it("/user/:email/email (PUT) : (실패, 사용자 본인 아님)", async () => {
		const fakerUser = await testService.insertStubUser(factoryUserStub("user"));
		const dto: ReplacePassWordDTO = {
			password: faker.internet.username(),
		};
		const adminAccessToken = testService.getAccessToken(admin);

		const response = await request(app.getHttpServer())
			.put(`/user/${fakerUser.email}/email`)
			.auth(adminAccessToken, { type: "bearer" })
			.send(dto)
			.expect(HttpStatus.FORBIDDEN);

		expect(response.body).toBeUndefined();
	});

	it("/user/:email/role (PUT) : (성공)", async () => {
		const fakerUser = await testService.insertStubUser(factoryUserStub("user"));
		const adminAccessToken = testService.getAccessToken(admin);

		const dto: ReplaceRoleDTO = {
			role: "admin",
		};

		const response = await request(app.getHttpServer())
			.put(`/user/${fakerUser.email}/role`)
			.auth(adminAccessToken, { type: "bearer" })
			.send(dto)
			.expect(HttpStatus.OK);

		expect(response.body).toBeUndefined();
	});
	it("/user/:email/role (PUT) : (실패, 권한 없음)", async () => {
		const fakerUser = await testService.insertStubUser(factoryUserStub("user"));
		const accessToken = testService.getAccessToken(fakerUser);

		const dto: ReplaceRoleDTO = {
			role: "admin",
		};

		const response = await request(app.getHttpServer())
			.put(`/user/${fakerUser.email}/role`)
			.auth(accessToken, { type: "bearer" })
			.send(dto)
			.expect(HttpStatus.FORBIDDEN);

		expect(response.body).toBeUndefined();
	});

	it("/user/:email (DELETE) : (성공)", async () => {
		const fakerUser = await testService.insertStubUser(factoryUserStub("user"));
		const oneTimeToken = await testService.createOneTimeToken(fakerUser, "delete-account");

		const response = await request(app.getHttpServer())
			.delete(`/user/${fakerUser.email}`)
			.set(ONE_TIME_TOKEN_HEADER.X_ONE_TIME_TOKEN, oneTimeToken.token)
			.set(ONE_TIME_TOKEN_HEADER.X_ONE_TIME_TOKEN_ID, oneTimeToken.id)
			.expect(HttpStatus.OK);

		expect(response.body).toBeUndefined();
	});

	it("/user/:email (DELETE) : (실패, 사용자 본인 아님)", async () => {
		const fakerUser = await testService.insertStubUser(factoryUserStub("user"));
		const adminOneTimeToken = await testService.createOneTimeToken(admin, "delete-account");

		const response = await request(app.getHttpServer())
			.delete(`/user/${fakerUser.email}`)
			.set(ONE_TIME_TOKEN_HEADER.X_ONE_TIME_TOKEN, adminOneTimeToken.token)
			.set(ONE_TIME_TOKEN_HEADER.X_ONE_TIME_TOKEN_ID, adminOneTimeToken.id)
			.expect(HttpStatus.OK);

		expect(response.body).toBeUndefined();
	});
	it("/user/:email (DELETE) : (실패, 사용자 본인이지만, 미유효 OneTimeToken)", async () => {
		const fakerUser = await testService.insertStubUser(factoryUserStub("user"));
		const usedOneTimeToken = await testService.createOneTimeToken(fakerUser, "delete-account");

		await testService.useOneTimeToken(usedOneTimeToken);

		const response = await request(app.getHttpServer())
			.delete(`/user/${fakerUser.email}`)
			.set(ONE_TIME_TOKEN_HEADER.X_ONE_TIME_TOKEN, usedOneTimeToken.token)
			.set(ONE_TIME_TOKEN_HEADER.X_ONE_TIME_TOKEN_ID, usedOneTimeToken.id)
			.expect(HttpStatus.OK);

		expect(response.body).toBeUndefined();
	});

	it("/user/recover/:email (PATCH) : (성공)", async () => {
		const fakerUser = await testService.insertStubUser(factoryUserStub("user"));
		await dbService.getRepository(User).softDelete({
			id: fakerUser.id,
		});

		const oneTimeToken = await testService.createOneTimeToken(fakerUser, "recover-account");

		const response = await request(app.getHttpServer())
			.patch(`/user/recover/${fakerUser.email}`)
			.set(ONE_TIME_TOKEN_HEADER.X_ONE_TIME_TOKEN, oneTimeToken.token)
			.set(ONE_TIME_TOKEN_HEADER.X_ONE_TIME_TOKEN_ID, oneTimeToken.id)
			.expect(HttpStatus.OK);

		expect(response.body).toBeUndefined();
	});
	it("/user/recover/:email (PATCH) : (실패, 사용자 본인 아님)", async () => {
		const fakerUser = await testService.insertStubUser(factoryUserStub("user"));
		await dbService.getRepository(User).softDelete({
			id: fakerUser.id,
		});

		const adminOneTimeToken = await testService.createOneTimeToken(admin, "recover-account");

		const response = await request(app.getHttpServer())
			.patch(`/user/recover/${fakerUser.email}`)
			.set(ONE_TIME_TOKEN_HEADER.X_ONE_TIME_TOKEN, adminOneTimeToken.token)
			.set(ONE_TIME_TOKEN_HEADER.X_ONE_TIME_TOKEN_ID, adminOneTimeToken.id)
			.expect(HttpStatus.FORBIDDEN);

		expect(response.body).toBeUndefined();
	});
	it("/user/recover/:email (PATCH) : (실패, 사용자 본인이지만, 미유효 OneTimeToken)", async () => {
		const fakerUser = await testService.insertStubUser(factoryUserStub("user"));
		await dbService.getRepository(User).softDelete({
			id: fakerUser.id,
		});

		const usedOneTimeToken = await testService.createOneTimeToken(fakerUser, "recover-account");
		await testService.useOneTimeToken(usedOneTimeToken);

		const response = await request(app.getHttpServer())
			.patch(`/user/recover/${fakerUser.email}`)
			.set(ONE_TIME_TOKEN_HEADER.X_ONE_TIME_TOKEN, usedOneTimeToken.token)
			.set(ONE_TIME_TOKEN_HEADER.X_ONE_TIME_TOKEN_ID, usedOneTimeToken.id)
			.expect(HttpStatus.FORBIDDEN);

		expect(response.body).toBeUndefined();
	});
});
