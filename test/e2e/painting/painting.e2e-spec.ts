/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { HttpStatus, INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { AppModule } from "../../../src/app.module";

import * as request from "supertest";
import { DatabaseService } from "../../../src/modules/db/db.service";
import { configNestApp } from "../../../src/app.config";
import { factoryPaintingStub } from "../../_shared/stub/painting.stub";
import { factoryTagStub } from "../../_shared/stub/tag.stub";
import { Pagination } from "../../../src/modules/_common/types";
import {
	ShowPainting,
	ShowPaintingResponse,
} from "../../../src/modules/painting/dto/response/showPainting.response";
import { getAdminUserStub, getNormalUserStub } from "../../_shared/stub/user.stub";
import { User } from "../../../src/modules/user/entity/user.entity";
import { CreatePaintingDTO } from "../../../src/modules/painting/dto/request/createPainting.dto";
import { ReplacePaintingDTO } from "../../../src/modules/painting/dto/request/replacePainting.dto";
import { FactoryArtistStub } from "../../_shared/stub/artist.stub";
import { factoryStyleStub } from "../../_shared/stub/style.stub";
import { TestService } from "../../_shared/test.service";
import { faker } from "@faker-js/faker";
import { TestModule } from "../../_shared/test.module";

describe("PaintingController (e2e)", () => {
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

	it("/painting (GET) : 성공 ", async () => {
		const response = await request(app.getHttpServer())
			.get("/painting")
			.query({
				page: 0,
			})
			.expect(200);

		expect((response.body as Pagination<ShowPainting>).data).toBeDefined();
	});
	it("/painting?tags=val1&tags=val2 (GET) : 성공, ", async () => {
		const [tag1, tag2] = await Promise.all([
			testService.insertTagStub(factoryTagStub()),
			testService.insertTagStub(factoryTagStub()),
		]);
		const [style, artist] = await Promise.all([
			testService.insertStyleStub(factoryStyleStub()),
			testService.insertArtistStub(FactoryArtistStub()),
		]);
		const painting = await testService.insertPaintingStub(
			factoryPaintingStub(),
			artist,
			[tag1, tag2],
			[style],
		);

		const response = await request(app.getHttpServer())
			.get("/painting/")
			.query({
				"tags[]": [tag1.name, tag2.name], // []에 원소가 2개 이상이면  tags: [{원소1}, {원소2}] 사용 가능
			})
			.expect(HttpStatus.OK);
		const body = response.body as Pagination<ShowPainting>;
		const expected: ShowPainting = {
			title: painting.title,
			id: painting.id,
			image_url: painting.image_url,
			height: painting.height,
			width: painting.width,
		};

		expect(body.total).toBe(1);
		expect(body).toStrictEqual(expected);
	});

	it("/painting?title=val1 (GET) : 성공,", async () => {
		const [tag1, tag2] = await Promise.all([
			testService.insertTagStub(factoryTagStub()),
			testService.insertTagStub(factoryTagStub()),
		]);
		const [style, artist] = await Promise.all([
			testService.insertStyleStub(factoryStyleStub()),
			testService.insertArtistStub(FactoryArtistStub()),
		]);
		const painting = await testService.insertPaintingStub(
			factoryPaintingStub(),
			artist,
			[tag1, tag2],
			[style],
		);

		const response = await request(app.getHttpServer())
			.get("/painting/")
			.query({
				title: painting.title.slice(0, 2),
			})
			.expect(200);
		const body = response.body as Pagination<ShowPainting>;
		expect(body.total).toBeGreaterThan(1);
		const hasPainting = body.data.some((showPainting) => showPainting.title === painting.title);
		expect(hasPainting).toBe(true);
	});

	it("/painting/by-ids?ids[]=val1 (GET) : 성공,", async () => {
		const [tag1, tag2] = await Promise.all([
			testService.insertTagStub(factoryTagStub()),
			testService.insertTagStub(factoryTagStub()),
		]);
		const [style, artist] = await Promise.all([
			testService.insertStyleStub(factoryStyleStub()),
			testService.insertArtistStub(FactoryArtistStub()),
		]);
		const painting1 = await testService.insertPaintingStub(
			factoryPaintingStub(),
			artist,
			[tag1, tag2],
			[style],
		);

		return request(app.getHttpServer())
			.get("/painting/by-ids")
			.query({
				ids: [painting1.id], // []에 원소가 1개면  "ids[]"": [{원소1}] 사용 가능
			})
			.expect(200)
			.expect((res) => {
				// 응답 데이터에서 title 확인
				expect((res.body as ShowPaintingResponse[])[0].title).toBe(painting1.title);
			});
	});

	it("/painting/by-ids?ids[]=val1 (GET) : (실패, 유효치않은 Query)", async () => {
		const [tag1, tag2] = await Promise.all([
			testService.insertTagStub(factoryTagStub()),
			testService.insertTagStub(factoryTagStub()),
		]);
		const [style, artist] = await Promise.all([
			testService.insertStyleStub(factoryStyleStub()),
			testService.insertArtistStub(FactoryArtistStub()),
		]);
		await testService.insertPaintingStub(factoryPaintingStub(), artist, [tag1, tag2], [style]);

		return request(app.getHttpServer())
			.get("/painting/by-ids")
			.query({
				ids: [faker.string.nanoid(), faker.string.uuid()], // []에 원소가 1개면  "ids[]"": [{원소1}] 사용 가능
			})
			.expect(400)
			.expect((res) => {
				// 응답 데이터에서 title 확인
				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
				expect(res.body.message[0]).toBe("each value in ids must be a UUID");
			});
	});

	it("/painting (POST) : 성공", async () => {
		const newPainting: CreatePaintingDTO = {
			title: faker.person.middleName(),
			image_url: faker.internet.url(),
			description: "this is new painting",
		};

		const adminAccessToken = testService.getAccessToken(admin);

		const createResponse = await request(app.getHttpServer())
			.post("/painting")
			.set("Content-Type", "application/json")
			.auth(adminAccessToken, { type: "bearer" })
			.send(newPainting)
			.expect(201);

		expect(createResponse.body).toMatchObject({
			...newPainting,
		});
	});

	it("/painting (POST) : (실패, 권한 없음)", async () => {
		const newPainting: CreatePaintingDTO = {
			title: faker.person.middleName(),
			image_url: faker.internet.url(),
			description: "this is new painting",
		};

		const userAccessToken = testService.getAccessToken(user);

		const createResponse = await request(app.getHttpServer())
			.post("/painting")
			.set("Content-Type", "application/json")
			.auth(userAccessToken, { type: "bearer" })
			.send(newPainting)
			.expect(HttpStatus.UNAUTHORIZED);

		expect(createResponse.body).toMatchObject({
			...newPainting,
		});
	});

	it("/painting/:id (PUT) : 성공", async () => {
		const [tag, style, artist] = await Promise.all([
			testService.insertTagStub(factoryTagStub()),
			testService.insertStyleStub(factoryStyleStub()),
			testService.insertArtistStub(FactoryArtistStub()),
		]);
		const painting = await testService.insertPaintingStub(
			factoryPaintingStub(),
			artist,
			[tag],
			[style],
		);

		const replaceTitle = "replace painting";
		const replaceDto: ReplacePaintingDTO = {
			tags: [tag.name],
			styles: [style.name],
			completition_year: painting.completition_year!,
			title: replaceTitle,
			image_url: painting.image_url,
			description: painting.description,
		};

		const adminAccessToken = testService.getAccessToken(admin);
		await request(app.getHttpServer())
			.PUT("/painting/" + painting.id)
			.set("Content-Type", "application/json")
			.auth(adminAccessToken, { type: "bearer" })
			.send(replaceDto)
			.expect(HttpStatus.OK);

		const getResponse = await request(app.getHttpServer())
			.get(`/painting/${painting.id}`)
			.expect(HttpStatus.OK);

		expect(getResponse.body).toMatchObject({
			title: replaceTitle,
		});
	});

	it("/painting/:id (PUT) : (실패, 권한 없음)", async () => {
		const [tag, style, artist] = await Promise.all([
			testService.insertTagStub(factoryTagStub()),
			testService.insertStyleStub(factoryStyleStub()),
			testService.insertArtistStub(FactoryArtistStub()),
		]);
		const painting = await testService.insertPaintingStub(
			factoryPaintingStub(),
			artist,
			[tag],
			[style],
		);

		const replaceTitle = "replace painting";
		const replaceDto: ReplacePaintingDTO = {
			tags: [tag.name],
			styles: [style.name],
			completition_year: painting.completition_year!,
			title: replaceTitle,
			image_url: painting.image_url,
			description: painting.description,
		};

		const userAccessToken = testService.getAccessToken(user);
		await request(app.getHttpServer())
			.PUT("/painting/" + painting.id)
			.set("Content-Type", "application/json")
			.auth(userAccessToken, { type: "bearer" })
			.send(replaceDto)
			.expect(HttpStatus.UNAUTHORIZED);
	});

	it("/painting/:id (DELETE) : 성공 ", async () => {
		const [tag, style, artist] = await Promise.all([
			testService.insertTagStub(factoryTagStub()),
			testService.insertStyleStub(factoryStyleStub()),
			testService.insertArtistStub(FactoryArtistStub()),
		]);
		const painting = await testService.insertPaintingStub(
			factoryPaintingStub(),
			artist,
			[tag],
			[style],
		);

		const adminAccessToken = testService.getAccessToken(admin);

		await request(app.getHttpServer())
			.DELETE("/painting/" + painting.id)
			.set("Content-Type", "application/json")
			.auth(adminAccessToken, { type: "bearer" })
			.expect(HttpStatus.UNAUTHORIZED);
	});

	it("/painting/:id (DELETE) : (실패, 권한 없음) ", async () => {
		const [tag, style, artist] = await Promise.all([
			testService.insertTagStub(factoryTagStub()),
			testService.insertStyleStub(factoryStyleStub()),
			testService.insertArtistStub(FactoryArtistStub()),
		]);
		const painting = await testService.insertPaintingStub(
			factoryPaintingStub(),
			artist,
			[tag],
			[style],
		);

		const userAccessToken = testService.getAccessToken(user);

		await request(app.getHttpServer())
			.DELETE("/painting/" + painting.id)
			.set("Content-Type", "application/json")
			.auth(userAccessToken, { type: "bearer" })
			.expect(HttpStatus.UNAUTHORIZED);
	});
});
