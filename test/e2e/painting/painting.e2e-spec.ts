import { HttpStatus, INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { AppModule } from "../../../src/app.module";
import { DatabaseService } from "../../../src/modules/db/db.service";
import { configNestApp } from "../../../src/app.config";
import { factoryUserStub } from "../../_shared/stub/user.stub";
import { User } from "../../../src/modules/user/entity/user.entity";
import { TestService } from "../../_shared/test.service";
import { faker } from "@faker-js/faker";
import { TestModule } from "../../_shared/test.module";
import createClient from "openapi-fetch";
import { ApiPaths, CreatePaintingDto, paths, ReplacePaintingDto } from "../../openapi/dto-types";
import { expectResponseBody } from "../_common/jest-zod";
import { zPagination } from "../_common/zodSchema";
import { zShowPainting, zShowPaintingResponse } from "./zodSchema";
import { Painting } from "../../../src/modules/painting/entities/painting.entity";
import { PaintingService } from "../../../src/modules/painting/painting.service";
import { Artist } from "../../../src/modules/artist/entities/artist.entity";
import { Tag } from "../../../src/modules/tag/entities/tag.entity";
import { Style } from "../../../src/modules/style/entities/style.entity";
import z from "zod";
import { pick, sortById } from "../../../src/utils/object";
import {
	ShowPainting,
	ShowPaintingResponse,
} from "../../../src/modules/painting/dto/response/showPainting.response";
import { getRandomElement } from "../../../src/utils/random";
import { assert } from "console";

if (process.env.VSCODE_INSPECTOR_OPTIONS) {
	console.log("Set setTimeout for debugging");
	jest.setTimeout(60 * 1000 * 10); // 10 minutes
}

describe("PaintingController (e2e)", () => {
	let app: INestApplication;
	let dbService: DatabaseService;
	let testService: TestService;
	let paintingService: PaintingService;
	let user: User;
	let admin: User;
	const port = 3001;
	const client = createClient<paths>({ baseUrl: `http://localhost:${port}` });

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
		// TODO: "/quiz/submit/:id (POST)" e2e 테스트 구현
		// - [ ] 공통 로직 구현
		// - [ ] 좋은 데이터 테스트 (모든 dto 경우에 대해 테스트)
		// - [ ] 나쁜 데이터 테스트 (비유효 path)
		// - [ ] 나쁜 데이터 테스트 (비유효 dto)

		let paintings: Painting[];
		beforeAll(async () => {
			paintings = await testService.seedPaintings(100);
		});

		describe("success when deliver valid query", () => {
			it("/painting (GET) : 성공 ", async () => {
				const targetPainting = paintings[0];
				const response = await client.GET(ApiPaths.PaintingController_searchMany, {
					params: {
						query: {
							tags: [targetPainting.tags[0].name],
						},
					},
				});

				expect(response.response.status).toBe(HttpStatus.OK);
				expect(response.data).toBeDefined();
				const body = response.data!;
				expect(body.total).toBe(1);
				expect(body.data[0].id).toBe(targetPainting.id);
				expectResponseBody(zPagination(zShowPainting), body);
			});

			it("/painting?title=val1 (GET) : 성공,", async () => {
				const expectedPainting = paintings[0];
				const response = await client.GET(ApiPaths.PaintingController_searchMany, {
					params: {
						query: {
							title: expectedPainting.title.slice(0, 2),
						},
					},
				});

				expect(response.response.status).toBe(HttpStatus.OK);
				expect(response.data).toBeDefined();
				const body = response.data!;
				expect(body.total).toBeGreaterThanOrEqual(1);
				expectResponseBody(zPagination(zShowPainting), body);

				const hasPainting = (body.data as ShowPainting[]).some(
					(showPainting) => showPainting.title === expectedPainting.title,
				);
				expect(hasPainting).toBe(true);
			});

			it("/painting?tag=val1&tag&val2 (GET) : 성공,", async () => {
				const expectedPainting = paintings[0];
				const response = await client.GET(ApiPaths.PaintingController_searchMany, {
					params: {
						query: {
							tags: expectedPainting.tags.map((t) => t.name),
						},
					},
				});

				expect(response.response.status).toBe(HttpStatus.OK);
				expect(response.data).toBeDefined();
				const body = response.data!;
				expect(body.total).toBe(1);
				expectResponseBody(zPagination(zShowPainting), body);
				expectResponseBody(zShowPainting, body.data[0]);
				expect(body.data[0].id).toBe(expectedPainting.id);
			});

			it("/painting?artistName=val1 (GET) : 성공,", async () => {
				const expectedPainting = paintings[0];
				const response = await client.GET(ApiPaths.PaintingController_searchMany, {
					params: {
						query: {
							artistName: expectedPainting.artist.name,
						},
					},
				});

				expect(response.response.status).toBe(HttpStatus.OK);
				expect(response.data).toBeDefined();
				const body = response.data!;

				expectResponseBody(zPagination(zShowPainting), body);
				expect(body.total).toBe(1);
				expectResponseBody(zShowPainting, body.data[0]);
				expect(body.data[0].id).toBe(expectedPainting.id);
			});
		});
	});

	describe("/painting/by-ids (GET)", () => {
		let paintings: Painting[];
		beforeAll(async () => {
			paintings = await testService.seedPaintings(10);
		});
		it("/painting/by-ids?ids=val1 (GET) : 성공,", async () => {
			const expectedPainting = getRandomElement(paintings);
			assert(expectedPainting !== undefined);

			const response = await client.GET(ApiPaths.PaintingController_getManyByIds, {
				params: {
					query: {
						ids: [expectedPainting!.id],
					},
				},
			});

			expect(response.response.status).toBe(HttpStatus.OK);
			expect(response.data).toBeDefined();
			const body = response.data!;
			expectResponseBody(z.array(zShowPaintingResponse), body);
			expect(body[0].title).toBe(expectedPainting!.title);
		});

		it("/painting/by-ids?ids=val1 (GET) : (실패, 유효치않은 Query)", async () => {
			const response = await client.GET(ApiPaths.PaintingController_getManyByIds, {
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
				tags: [],
				styles: [],
			};
		}

		beforeAll(async () => {
			artist = (await testService.seedArtists(1))[0];
			tag = (await testService.seedTags(1))[0];
			style = (await testService.seedStyles(1))[0];
		});
		it("/painting (POST) : (성공, no relation)", async () => {
			const dto = factoryBaseCreateDto();

			const adminAuthorization = testService.getBearerAuthCredential(admin);

			const response = await client.POST(route, {
				params: {
					header: {
						authorization: adminAuthorization,
					},
				},
				body: dto,
			});

			expect(response.response.status).toBe(HttpStatus.CREATED);
			expect(response.data).toBeDefined();
			expectResponseBody(zShowPainting, response.data);

			const painting = (await paintingService.getManyByIds([response.data!.id]))[0];

			expect(response.data).toMatchObject(new ShowPainting(painting));
		});

		it("/painting (POST) : (성공, relation exist)", async () => {
			const dto = factoryBaseCreateDto();
			dto.artistName = artist.name;
			dto.tags = [tag.name];
			dto.styles = [style.name];

			const adminAuthorization = testService.getBearerAuthCredential(admin);

			const response = await client.POST(route, {
				params: {
					header: {
						authorization: adminAuthorization,
					},
				},
				body: dto,
			});

			expect(response.response.status).toBe(HttpStatus.CREATED);
			expect(response.data).toBeDefined();
			expectResponseBody(zShowPainting, response.data);

			const entity = (await paintingService.getManyByIds([response.data!.id]))[0];
			expect(response.data).toMatchObject(new ShowPainting(entity));

			expect(entity.artist).toMatchObject(artist);
			expect(entity.tags).toEqual([tag]);
			expect(entity.styles).toEqual([style]);
		});

		it("/painting (POST) : (실패, 권한 없음)", async () => {
			const artist = (await testService.seedArtists(1))[0];

			const dto: CreatePaintingDto = {
				title: faker.person.middleName(),
				image_url: faker.internet.url(),
				description: "this is new painting",
				width: faker.number.int({ min: 100, max: 1000 }),
				height: faker.number.int({ min: 100, max: 1000 }),
				image_s3_key: faker.commerce.product(),
				artistName: artist.name,
				tags: [],
				styles: [],
			};

			const authorization = testService.getBearerAuthCredential(user);

			const response = await client.POST(ApiPaths.PaintingController_createPainting, {
				params: {
					header: {
						authorization,
					},
				},
				body: dto,
			});

			expect(response.response.status).toBe(HttpStatus.FORBIDDEN);
		});
	});

	describe("/painting/:id (PUT)", () => {
		let dto: ReplacePaintingDto;
		let painting: Painting;
		let response: Awaited<ReturnType<typeof requestReplacePainting>>;
		const pickKeys = [
			"completition_year",
			"image_url",
			"description",
			"width",
			"height",
			"image_s3_key",
			"title",
		] as const;
		type ReplaceField =
			| "tags"
			| "styles"
			| "completition_year"
			| "title"
			| "image_url"
			| "description"
			| "width"
			| "height"
			| "image_s3_key"
			| "artist";
		function factoryReplaceDto<K extends ReplaceField>(
			painting: Painting,
			replaces: Partial<Pick<Painting, K>>,
		): ReplacePaintingDto {
			const copied = structuredClone(painting);

			Object.entries(replaces).forEach(([key, v]) => {
				if (v) {
					const prop = key as K;
					copied[prop] = v as Painting[typeof prop];
				}
			});

			const dto = {
				tags: copied.tags.map((t) => t.name),
				styles: copied.styles.map((style) => style.name),
				completition_year: copied.completition_year!,
				title: copied.title,
				image_url: copied.image_url,
				description: copied.description,
				width: copied.width,
				height: copied.height,
				image_s3_key: copied.image_s3_key,
				artistName: copied.artist.name,
			};

			return dto;
		}

		async function requestReplacePainting(
			id: string,
			authorization: string,
			body: ReplacePaintingDto,
		) {
			const response = await client.PUT(ApiPaths.PaintingController_replacePainting, {
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
		describe("success when replace title by admin", () => {
			let expectedPainting: Painting;
			let receivedPainting: Painting;
			beforeAll(async () => {
				const paintings = await testService.seedPaintings(10);
				painting = paintings[0];
				dto = factoryReplaceDto(painting, { title: "replace title" });
				dto.title = "replace title";
				expectedPainting = { ...painting, title: dto.title };
				const adminAuthorization = testService.getBearerAuthCredential(admin);

				response = await requestReplacePainting(painting.id, adminAuthorization, dto);
				receivedPainting = (await paintingService.findOne({
					where: { id: painting.id },
					relations: { artist: true, tags: true, styles: true },
				}))!;
			});

			it("response is success", () => {
				expect(response.response.status).toBe(HttpStatus.OK);
			});

			it("no change fields without title", () => {
				expect(pick(receivedPainting!, pickKeys)).toEqual(pick(expectedPainting, pickKeys));
				expect(receivedPainting!.title).toEqual(expectedPainting.title);
			});

			it("no change relations", () => {
				expect(receivedPainting!.artist).toEqual(expectedPainting.artist);
				expect(sortById(receivedPainting.tags)).toEqual(sortById(expectedPainting.tags));
				expect(sortById(receivedPainting.styles)).toEqual(
					sortById(expectedPainting.styles),
				);
			});
		});
		describe("success when replace relations by admin", () => {
			let newTag: Tag;
			let newStyle: Style;
			let newArtist: Artist;
			let expectedPainting: Painting;
			let receivedPainting: Painting;
			beforeAll(async () => {
				const [tags, styles, artists, paintings] = await Promise.all([
					testService.seedTags(1),
					testService.seedStyles(1),
					testService.seedArtists(1),
					testService.seedPaintings(1),
				]);

				newTag = tags[0];
				newStyle = styles[0];
				newArtist = artists[0];
				painting = paintings[0];
				dto = factoryReplaceDto(painting, {
					tags: [newTag],
					styles: [newStyle],
					artist: newArtist,
				});
				expectedPainting = {
					...painting,
					tags: [newTag],
					styles: [newStyle],
					artist: newArtist,
				};

				const adminAuthorization = testService.getBearerAuthCredential(admin);

				response = await requestReplacePainting(painting.id, adminAuthorization, dto);
				receivedPainting = (await paintingService.findOne({
					where: { id: painting.id },
					relations: { artist: true, tags: true, styles: true },
				}))!;
			});

			it("only admin role can replace painting", () => {
				expect(response!.response.status).toBe(HttpStatus.OK);
			});

			it("response should be matched", () => {
				const receivedRes = response.data;
				const expectedRes = new ShowPaintingResponse(expectedPainting);
				expectResponseBody(zShowPaintingResponse, receivedRes);
				expect(receivedRes).toEqual(expectedRes);
			});

			it("no change fields without title", () => {
				expect(pick(receivedPainting, pickKeys)).toEqual(pick(expectedPainting, pickKeys));
			});
			it("relations should be replaced", () => {
				expect(receivedPainting.artist).toEqual(expectedPainting.artist);
				expect(sortById(receivedPainting.tags)).toEqual(sortById(expectedPainting.tags));
				expect(sortById(receivedPainting.styles)).toEqual(
					sortById(expectedPainting.styles),
				);
			});
		});

		describe("fail because user can't to replace painting", () => {
			let error: (typeof response)["error"];
			let expectedPainting: Painting;
			let receivedPainting: Painting;
			beforeAll(async () => {
				const paintings = await testService.seedPaintings(1);
				painting = paintings[0];
				dto = factoryReplaceDto(painting, { title: "new title" });
				expectedPainting = { ...painting };
				const authorization = testService.getBearerAuthCredential(user);
				response = await requestReplacePainting(painting.id, authorization, dto);
				receivedPainting = (await paintingService.findOne({
					where: { id: painting.id },
					relations: { artist: true, tags: true, styles: true },
				}))!;
				error = response.error;
			});

			it("response should be FORBIDDEN", () => {
				expect(response.response.status).toBe(HttpStatus.FORBIDDEN);
			});

			it("entity should be not changed", () => {
				expect(receivedPainting).toEqual(expectedPainting);
			});

			it("error should be received", () => {
				expect(error).toBeDefined();
			});
		});

		describe("fail because dto miss fields", () => {
			let error: (typeof response)["error"];
			let expectedPainting: Painting;
			let receivedPainting: Painting;
			beforeAll(async () => {
				const paintings = await testService.seedPaintings(1);
				painting = paintings[0];
				dto = factoryReplaceDto(painting, { title: "new title" });
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const { title: _title, ...partialDto } = dto;
				expectedPainting = { ...painting };

				const adminAuthorization = testService.getBearerAuthCredential(admin);
				response = await requestReplacePainting(
					painting.id,
					adminAuthorization,
					partialDto as ReplacePaintingDto,
				);
				receivedPainting = (await paintingService.findOne({
					where: { id: painting.id },
					relations: { artist: true, tags: true, styles: true },
				}))!;
				error = response.error;
			});

			it("invalidate query receive 400 error", () => {
				expect(response.response.status).toBe(HttpStatus.BAD_REQUEST);
			});

			it("entity should be not changed", () => {
				expect(receivedPainting).toEqual(expectedPainting);
			});

			it("error should be received", () => {
				expect(error).toBeDefined();
			});
		});
	});

	describe("/painting/:id (DELETE)", () => {
		const route = ApiPaths.PaintingController_deletePainting;

		let painting: Painting;
		beforeEach(async () => {
			const paintings = await testService.seedPaintings(1);
			painting = paintings[0];
		});
		it("success delete painting when admin request ", async () => {
			const adminAuthorization = testService.getBearerAuthCredential(admin);

			const response = await client.DELETE(route, {
				params: {
					path: {
						id: painting.id,
					},
					header: {
						authorization: adminAuthorization,
					},
				},
			});

			expect(response.response.status).toBe(HttpStatus.OK);
			expect(await paintingService.findOne({ where: { id: painting.id } })).toBeNull();

			const entity = await paintingService.findOne({
				where: { id: painting.id },
				withDeleted: true,
			});

			expect(entity).toBeDefined();

			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { deleted_date: dd, updated_date: ud, version: v, ...expected } = painting;
			const { deleted_date, updated_date, version, ...received } = entity!;

			expect(version).toBe(v! + 1);
			expect(received).toEqual(expected);
			expect(deleted_date).toEqual(updated_date);
		});

		it("/painting/:id (DELETE) : (실패, 권한 없음) ", async () => {
			const authorization = testService.getBearerAuthCredential(user);

			const response = await client.DELETE(route, {
				params: {
					path: {
						id: painting.id,
					},
					header: {
						authorization,
					},
				},
			});

			expect(response.response.status).toBe(HttpStatus.FORBIDDEN);
		});
	});
});
