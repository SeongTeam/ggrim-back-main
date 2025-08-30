/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { HttpStatus, INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { AppModule } from "../../../src/app.module";
import { DatabaseService } from "../../../src/modules/db/db.service";
import { configNestApp } from "../../../src/app.config";
import { factoryPaintingStub } from "../../_shared/stub/painting.stub";
import { factoryTagStub } from "../../_shared/stub/tag.stub";
import { ShowPainting } from "../../../src/modules/painting/dto/response/showPainting.response";
import { getAdminUserStub, getNormalUserStub } from "../../_shared/stub/user.stub";
import { User } from "../../../src/modules/user/entity/user.entity";
import { CreatePaintingDTO } from "../../../src/modules/painting/dto/request/createPainting.dto";
import { ReplacePaintingDTO } from "../../../src/modules/painting/dto/request/replacePainting.dto";
import { FactoryArtistStub } from "../../_shared/stub/artist.stub";
import { factoryStyleStub } from "../../_shared/stub/style.stub";
import { TestService } from "../../_shared/test.service";
import { faker } from "@faker-js/faker";
import { TestModule } from "../../_shared/test.module";
import createClient from "openapi-fetch";
import { ApiPaths, paths } from "../../swagger/dto-types";
import { expectResponseBody } from "../_common/jest-zod";
import { zPagination } from "../_common/zodSchema";
import { zShowPainting, zShowPaintingResponse } from "./zodSchema";
import { Painting } from "../../../src/modules/painting/entities/painting.entity";
import { PaintingService } from "../../../src/modules/painting/painting.service";

describe("PaintingController (e2e)", () => {
	let app: INestApplication;
	let dbService: DatabaseService;
	let testService: TestService;
	let paintingService: PaintingService;
	let user: User;
	let admin: User;
	const port = 3001;
	const client = createClient<paths>({ baseUrl: `http://localhost:${port}` });
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
		paintingService = moduleFixture.get(PaintingService);
		await dbService.resetDB();
		user = await testService.insertStubUser(getNormalUserStub());
		admin = await testService.insertStubUser(getAdminUserStub());

		await app.listen(port);
	});

	afterAll(async () => {
		await dbService.resetDB();
		await app.close();
	});

	describe("/painting (GET) Test", () => {
		let painting: Painting;
		beforeAll(async () => {
			const [tag1, tag2, tag3, tag4] = await Promise.all([
				testService.insertTagStub(factoryTagStub()),
				testService.insertTagStub(factoryTagStub()),
				testService.insertTagStub(factoryTagStub()),
				testService.insertTagStub(factoryTagStub()),
			]);
			const [style1, style2, style3] = await Promise.all([
				testService.insertStyleStub(factoryStyleStub()),
				testService.insertStyleStub(factoryStyleStub()),
				testService.insertStyleStub(factoryStyleStub()),
			]);
			const [artist1, artist2, artist3] = await Promise.all([
				testService.insertArtistStub(FactoryArtistStub()),
				testService.insertArtistStub(FactoryArtistStub()),
				testService.insertArtistStub(FactoryArtistStub()),
			]);
			painting = await testService.insertPaintingStub(
				factoryPaintingStub(),
				artist1,
				[tag1, tag2],
				[style1],
			);

			// seed Painting
			await Promise.all(
				Array(10)
					.fill(0)
					.map(() =>
						testService.insertPaintingStub(
							factoryPaintingStub(),
							artist2,
							[tag3, tag4],
							[style2],
						),
					),
			);
			await Promise.all(
				Array(10)
					.fill(0)
					.map(() =>
						testService.insertPaintingStub(
							factoryPaintingStub(),
							artist3,
							[tag2, tag4],
							[style3],
						),
					),
			);
		});

		afterAll(async () => {
			await dbService.resetDB();
		});

		it("/painting (GET) : 성공 ", async () => {
			const response = await client.GET(ApiPaths.PaintingController_searchPainting, {
				params: {
					query: {
						tags: [painting.tags[0].name],
					},
				},
			});

			expect(response.response.status).toBe(HttpStatus.OK);
			expect(response.data).toBeDefined();
			const body = response.data!;
			expect(body.total).toBe(1);
			expect(body.data[0].id).toBe(painting.id);
			expectResponseBody(zPagination(zShowPainting), body);
		});

		it("/painting?title=val1 (GET) : 성공,", async () => {
			const response = await client.GET(ApiPaths.PaintingController_searchPainting, {
				params: {
					query: {
						title: painting.title.slice(0, 2),
					},
				},
			});

			expect(response.response.status).toBe(HttpStatus.OK);
			expect(response.data).toBeDefined();
			const body = response.data!;
			expect(body.total).toBeGreaterThan(1);
			expectResponseBody(zPagination(zShowPainting), body);

			const hasPainting = (body.data as ShowPainting[]).some(
				(showPainting) => showPainting.title === painting.title,
			);
			expect(hasPainting).toBe(true);
		});

		it("/painting?tag=val1&tag&val2 (GET) : 성공,", async () => {
			const response = await client.GET(ApiPaths.PaintingController_searchPainting, {
				params: {
					query: {
						tags: painting.tags.map((t) => t.name),
					},
				},
			});

			expect(response.response.status).toBe(HttpStatus.OK);
			expect(response.data).toBeDefined();
			const body = response.data!;
			expect(body.total).toBe(1);
			expectResponseBody(zPagination(zShowPainting), body);
			expectResponseBody(zShowPainting, body.data[0]);
			expect(body.data[0].id).toBe(painting.id);
		});

		it("/painting?artistName=val1 (GET) : 성공,", async () => {
			const response = await client.GET(ApiPaths.PaintingController_searchPainting, {
				params: {
					query: {
						artistName: painting.artist.name,
					},
				},
			});

			expect(response.response.status).toBe(HttpStatus.OK);
			expect(response.data).toBeDefined();
			const body = response.data!;

			expectResponseBody(zPagination(zShowPainting), body);
			expect(body.total).toBe(1);
			expectResponseBody(zShowPainting, body.data[0]);
			expect(body.data[0].id).toBe(painting.id);
		});
	});

	it("/painting/by-ids?ids=val1 (GET) : 성공,", async () => {
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

		const response = await client.GET(ApiPaths.PaintingController_getByIds, {
			params: {
				query: {
					ids: [painting1.id],
				},
			},
		});

		expect(response.response.status).toBe(HttpStatus.OK);
		expect(response.data).toBeDefined();
		const body = response.data!;

		// 응답 데이터에서 title 확인
		expect(body[0].title).toBe(painting1.title);
	});

	it("/painting/by-ids?ids=val1 (GET) : (실패, 유효치않은 Query)", async () => {
		const [tag1, tag2] = await Promise.all([
			testService.insertTagStub(factoryTagStub()),
			testService.insertTagStub(factoryTagStub()),
		]);
		const [style, artist] = await Promise.all([
			testService.insertStyleStub(factoryStyleStub()),
			testService.insertArtistStub(FactoryArtistStub()),
		]);
		await testService.insertPaintingStub(factoryPaintingStub(), artist, [tag1, tag2], [style]);

		const response = await client.GET(ApiPaths.PaintingController_getByIds, {
			params: {
				query: {
					ids: [faker.string.nanoid(), faker.string.uuid()],
				},
			},
		});
		expect(response.response.status).toBe(HttpStatus.BAD_REQUEST);
	});

	it("/painting (POST) : 성공", async () => {
		const dto: CreatePaintingDTO = {
			title: faker.person.middleName(),
			image_url: faker.internet.url(),
			description: "this is new painting",
		};

		const adminAccessToken = testService.getAccessToken(admin);

		const response = await client.POST(ApiPaths.PaintingController_createPainting, {
			params: {
				header: {
					authorization: `Bearer ${adminAccessToken}`,
				},
			},
			body: dto,
		});

		//TODO 그림 생성 로직 버그 해결. 상태 500 발생
		expect(response.response.status).toBe(HttpStatus.CREATED);
		expect(response.data).toBeDefined();
		expectResponseBody(zShowPaintingResponse, response.data);

		const painting = (await paintingService.getByIds([response.data!.id]))[0];

		expect(response.data).toMatchObject(painting);
	});

	it("/painting (POST) : (실패, 권한 없음)", async () => {
		const dto: CreatePaintingDTO = {
			title: faker.person.middleName(),
			image_url: faker.internet.url(),
			description: "this is new painting",
		};

		const userAccessToken = testService.getAccessToken(user);

		const response = await client.POST(ApiPaths.PaintingController_createPainting, {
			params: {
				header: {
					authorization: `Bearer ${userAccessToken}`,
				},
			},
			body: dto,
		});

		expect(response.response.status).toBe(HttpStatus.FORBIDDEN);
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

		const response = await client.PUT(ApiPaths.PaintingController_replacePainting, {
			params: {
				path: {
					id: painting.id,
				},
				header: {
					authorization: `Bearer ${adminAccessToken}`,
				},
			},
			body: replaceDto,
		});

		expect(response.response.status).toBe(HttpStatus.OK);
		expect(response.data).toBeDefined();
		expectResponseBody(zShowPaintingResponse, response.data);
		const entity = (await paintingService.getByIds([painting.id]))[0];

		expect(response.data).toMatchObject(entity);
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
		const response = await client.PUT(ApiPaths.PaintingController_replacePainting, {
			params: {
				path: {
					id: painting.id,
				},
				header: {
					authorization: `Bearer ${userAccessToken}`,
				},
			},
			body: replaceDto,
		});

		expect(response.response.status).toBe(HttpStatus.FORBIDDEN);
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

		const response = await client.DELETE(ApiPaths.PaintingController_deletePainting, {
			params: {
				path: {
					id: painting.id,
				},
				header: {
					authorization: `Bearer ${adminAccessToken}`,
				},
			},
		});

		expect(response.response.status).toBe(HttpStatus.OK);
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

		const response = await client.DELETE(ApiPaths.PaintingController_deletePainting, {
			params: {
				path: {
					id: painting.id,
				},
				header: {
					authorization: `Bearer ${userAccessToken}`,
				},
			},
		});

		expect(response.response.status).toBe(HttpStatus.FORBIDDEN);
	});
});
