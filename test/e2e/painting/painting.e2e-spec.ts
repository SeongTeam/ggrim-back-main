/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { HttpStatus, INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { AppModule } from "../../../src/app.module";
import { DatabaseService } from "../../../src/modules/db/db.service";
import { configNestApp } from "../../../src/app.config";
import { factoryPaintingStub } from "../../_shared/stub/painting.stub";
import { factoryTagStub } from "../../_shared/stub/tag.stub";
import { ShowPainting } from "../../../src/modules/painting/dto/response/showPainting.response";
import { factoryUserStub } from "../../_shared/stub/user.stub";
import { User } from "../../../src/modules/user/entity/user.entity";
import { FactoryArtistStub } from "../../_shared/stub/artist.stub";
import { factoryStyleStub } from "../../_shared/stub/style.stub";
import { TestService } from "../../_shared/test.service";
import { faker } from "@faker-js/faker";
import { TestModule } from "../../_shared/test.module";
import createClient from "openapi-fetch";
import { ApiPaths, CreatePaintingDto, paths, ReplacePaintingDto } from "../../swagger/dto-types";
import { expectResponseBody } from "../_common/jest-zod";
import { zPagination } from "../_common/zodSchema";
import { zShowPainting, zShowPaintingResponse } from "./zodSchema";
import { Painting } from "../../../src/modules/painting/entities/painting.entity";
import { PaintingService } from "../../../src/modules/painting/painting.service";
import { Artist } from "../../../src/modules/artist/entities/artist.entity";
import { Tag } from "../../../src/modules/tag/entities/tag.entity";
import { Style } from "../../../src/modules/style/entities/style.entity";
import z from "zod";
import { ServiceException } from "../../../src/modules/_common/filter/exception/service/serviceException";

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
		user = await testService.insertStubUser(factoryUserStub("user"));
		admin = await testService.insertStubUser(factoryUserStub("admin"));

		await app.listen(port);
	});

	afterAll(async () => {
		//await dbService.resetDB();
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
			expect(body.total).toBeGreaterThanOrEqual(1);
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

	describe("/painting/by-ids (GET)", () => {
		let tag1, tag2: Tag;
		let style: Style;
		let artist: Artist;
		let painting: Painting;
		beforeAll(async () => {
			[tag1, tag2] = await Promise.all([
				testService.insertTagStub(factoryTagStub()),
				testService.insertTagStub(factoryTagStub()),
			]);
			[style, artist] = await Promise.all([
				testService.insertStyleStub(factoryStyleStub()),
				testService.insertArtistStub(FactoryArtistStub()),
			]);
			painting = await testService.insertPaintingStub(
				factoryPaintingStub(),
				artist,
				[tag1, tag2],
				[style],
			);
		});
		it("/painting/by-ids?ids=val1 (GET) : 성공,", async () => {
			const response = await client.GET(ApiPaths.PaintingController_getByIds, {
				params: {
					query: {
						ids: [painting.id],
					},
				},
			});

			expect(response.response.status).toBe(HttpStatus.OK);
			expect(response.data).toBeDefined();
			const body = response.data!;
			expectResponseBody(z.array(zShowPaintingResponse), body);
			expect(body[0].title).toBe(painting.title);
		});

		it("/painting/by-ids?ids=val1 (GET) : (실패, 유효치않은 Query)", async () => {
			const response = await client.GET(ApiPaths.PaintingController_getByIds, {
				params: {
					query: {
						ids: [faker.string.nanoid(), faker.string.uuid()],
					},
				},
			});
			expect(response.response.status).toBe(HttpStatus.BAD_REQUEST);
		});
	});
	describe("/painting (POST)", () => {
		const route = ApiPaths.PaintingController_createPainting;
		let artist: Artist;
		let tag: Tag;
		let style: Style;

		function factoryBaseCreateDto(): CreatePaintingDto {
			return {
				title: faker.person.middleName(),
				image_url: faker.internet.url(),
				description: "this is new painting",
				width: faker.number.int({ min: 100, max: 1000 }),
				height: faker.number.int({ min: 100, max: 1000 }),
				image_s3_key: faker.commerce.product(),
			};
		}

		beforeAll(async () => {
			artist = await testService.insertArtistStub(FactoryArtistStub());
			tag = await testService.insertTagStub(factoryTagStub());
			style = await testService.insertStyleStub(factoryStyleStub());
		});
		it("/painting (POST) : (성공, no relation)", async () => {
			const dto = factoryBaseCreateDto();

			const adminAccessToken = testService.getAccessToken(admin);

			const response = await client.POST(route, {
				params: {
					header: {
						authorization: `Bearer ${adminAccessToken}`,
					},
				},
				body: dto,
			});

			expect(response.response.status).toBe(HttpStatus.CREATED);
			expect(response.data).toBeDefined();
			expectResponseBody(zShowPainting, response.data);

			const painting = (await paintingService.getByIds([response.data!.id]))[0];

			expect(response.data).toMatchObject(new ShowPainting(painting));
		});

		it("/painting (POST) : (성공, relation exist)", async () => {
			const dto = factoryBaseCreateDto();
			dto.artistName = artist.name;
			dto.tags = [tag.name];
			dto.styles = [style.name];

			const adminAccessToken = testService.getAccessToken(admin);

			const response = await client.POST(route, {
				params: {
					header: {
						authorization: `Bearer ${adminAccessToken}`,
					},
				},
				body: dto,
			});

			expect(response.response.status).toBe(HttpStatus.CREATED);
			expect(response.data).toBeDefined();
			expectResponseBody(zShowPainting, response.data);

			const entity = (await paintingService.getByIds([response.data!.id]))[0];
			expect(response.data).toMatchObject(new ShowPainting(entity));

			expect(entity.artist).toMatchObject(artist);
			expect(entity.tags).toEqual([tag]);
			expect(entity.styles).toEqual([style]);
		});

		it("/painting (POST) : (실패, 권한 없음)", async () => {
			const artist = await testService.insertArtistStub(FactoryArtistStub());

			const dto: CreatePaintingDto = {
				title: faker.person.middleName(),
				image_url: faker.internet.url(),
				description: "this is new painting",
				width: faker.number.int({ min: 100, max: 1000 }),
				height: faker.number.int({ min: 100, max: 1000 }),
				image_s3_key: faker.commerce.product(),
				artistName: artist.name,
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
	});

	describe("/painting/:id (PUT)", () => {
		const route = ApiPaths.PaintingController_replacePainting;
		let painting: Painting;

		function factoryBaseReplaceDto(painting: Painting): ReplacePaintingDto {
			return {
				tags: painting.tags.map((t) => t.name),
				styles: painting.tags.map((style) => style.name),
				completition_year: painting.completition_year!,
				title: "replace painting",
				image_url: painting.image_url,
				description: painting.description,
				width: painting.width,
				height: painting.height,
				image_s3_key: painting.image_s3_key,
				artistName: painting.artist.name,
			};
		}

		beforeAll(async () => {
			const [tag, style, artist] = await Promise.all([
				testService.insertTagStub(factoryTagStub()),
				testService.insertStyleStub(factoryStyleStub()),
				testService.insertArtistStub(FactoryArtistStub()),
			]);
			painting = await testService.insertPaintingStub(
				factoryPaintingStub(),
				artist,
				[tag],
				[style],
			);
		});
		it("/painting/:id (PUT) : (성공, not change relation)", async () => {
			const replaceDto = factoryBaseReplaceDto(painting);
			replaceDto.title = "replace title";
			replaceDto.tags = painting.tags.map((t) => t.name);
			replaceDto.styles = painting.styles.map((s) => s.name);
			const adminAccessToken = testService.getAccessToken(admin);

			const response = await client.PUT(route, {
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
			const entity = (await paintingService.getByIds([painting.id]))[0];
			expect({
				completition_year: entity.completition_year,
				image_url: entity.image_url,
				description: entity.description,
				width: entity.width,
				height: entity.height,
				image_s3_key: entity.image_s3_key,
				artistName: entity.artist.name,
				title: entity.title,
			}).toEqual({
				completition_year: replaceDto.completition_year,
				image_url: replaceDto.image_url,
				description: replaceDto.description,
				width: replaceDto.width,
				height: replaceDto.height,
				image_s3_key: replaceDto.image_s3_key,
				artistName: replaceDto.artistName,
				title: replaceDto.title,
			});

			expect(entity.artist).toEqual(painting.artist);
			expect(entity.tags).toEqual(painting.tags);
			expect(entity.styles).toEqual(painting.styles);
		});
		it("/painting/:id (PUT) : (성공, change relation)", async () => {
			const replaceDto = factoryBaseReplaceDto(painting);
			const [newTag, newStyle, newArtist] = await Promise.all([
				testService.insertTagStub(factoryTagStub()),
				testService.insertStyleStub(factoryStyleStub()),
				testService.insertArtistStub(FactoryArtistStub()),
			]);
			replaceDto.artistName = newArtist.name;
			replaceDto.tags = [newTag.name];
			replaceDto.styles = [newStyle.name];
			const adminAccessToken = testService.getAccessToken(admin);

			const response = await client.PUT(route, {
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
			const entity = (await paintingService.getByIds([painting.id]))[0];
			expect({
				completition_year: entity.completition_year,
				image_url: entity.image_url,
				description: entity.description,
				width: entity.width,
				height: entity.height,
				image_s3_key: entity.image_s3_key,
				artistName: entity.artist.name,
				title: entity.title,
			}).toEqual({
				completition_year: replaceDto.completition_year,
				image_url: replaceDto.image_url,
				description: replaceDto.description,
				width: replaceDto.width,
				height: replaceDto.height,
				image_s3_key: replaceDto.image_s3_key,
				artistName: replaceDto.artistName,
				title: replaceDto.title,
			});

			expect(entity.artist).toEqual(newArtist);
			expect(entity.tags).toEqual([newTag]);
			expect(entity.styles).toEqual([newStyle]);
		});

		it("/painting/:id (PUT) : (실패, 권한 없음)", async () => {
			const replaceDto = factoryBaseReplaceDto(painting);
			replaceDto.title = "new title";

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
	});

	describe("/painting/:id (DELETE)", () => {
		const route = ApiPaths.PaintingController_deletePainting;
		let painting: Painting;
		beforeEach(async () => {
			const [tag, style, artist] = await Promise.all([
				testService.insertTagStub(factoryTagStub()),
				testService.insertStyleStub(factoryStyleStub()),
				testService.insertArtistStub(FactoryArtistStub()),
			]);
			painting = await testService.insertPaintingStub(
				factoryPaintingStub(),
				artist,
				[tag],
				[style],
			);
		});
		it("/painting/:id (DELETE) : 성공 ", async () => {
			const adminAccessToken = testService.getAccessToken(admin);

			const response = await client.DELETE(route, {
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
			expect(await paintingService.getByIds([painting.id])).toThrow(ServiceException);
		});

		it("/painting/:id (DELETE) : (실패, 권한 없음) ", async () => {
			const userAccessToken = testService.getAccessToken(user);

			const response = await client.DELETE(route, {
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
});
