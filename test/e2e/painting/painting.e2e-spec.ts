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
import { zShowPainting, zShowPaintingResponse } from "./zodSchema";
import { Painting } from "../../../src/modules/painting/entities/painting.entity";
import { PaintingService } from "../../../src/modules/painting/painting.service";
import z from "zod";
import { pick } from "../../../src/utils/object";
import { ShowPainting } from "../../../src/modules/painting/dto/response/showPainting.response";
import { getRandomElement, selectRandomElements } from "../../../src/utils/random";
import { assert } from "console";
import { factoryPaintingStub, PaintingDummy } from "../../_shared/stub/painting.stub";
import { factoryTagStub, TagDummy } from "../../_shared/stub/tag.stub";
import { ArtistDummy, factoryArtistStub } from "../../_shared/stub/artist.stub";
import { factoryStyleStub, StyleDummy } from "../../_shared/stub/style.stub";
import { UserService } from "../../../src/modules/user/user.service";
import { Artist } from "../../../src/modules/artist/entities/artist.entity";
import { Style } from "../../../src/modules/style/entities/style.entity";
import { Tag } from "../../../src/modules/tag/entities/tag.entity";
import { sortByLocale } from "../../../src/utils/array";
import { zPagination } from "../_common/zodSchema";

if (process.env.VSCODE_INSPECTOR_OPTIONS) {
	console.log("Set setTimeout for debugging");
	jest.setTimeout(60 * 1000 * 10); // 10 minutes
}

describe("PaintingController (e2e)", () => {
	let app: INestApplication;
	let dbService: DatabaseService;
	let testService: TestService;
	let paintingService: PaintingService;
	let userService: UserService;
	const port = 3001;
	const client = createClient<paths>({ baseUrl: `http://localhost:${port}` });

	const _tagStubs = Array(10)
		.fill(0)
		.map(() => factoryTagStub());
	const _styleStubs = Array(10)
		.fill(0)
		.map(() => factoryStyleStub());
	const _artistStubs = Array(10)
		.fill(0)
		.map(() => factoryArtistStub());

	let _tags: Tag[];
	let _styles: Style[];
	let _artists: Artist[];
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
		userService = moduleFixture.get(UserService);
		await dbService.resetDB();

		await app.listen(port);

		//arrange relational resources to share cross over all Painting test
		[_tags, _styles, _artists] = await Promise.all([
			testService.insertTagStubs(_tagStubs),
			testService.insertStyleStubs(_styleStubs),
			testService.insertArtistStubs(_artistStubs),
		]);
		await testService.seedPaintings(100, {
			tags: _tags,
			styles: _styles,
			artists: _artists,
		});
	});

	afterAll(async () => {
		//await dbService.resetDB();
		await app.close();
	});

	describe("/painting (GET) ", () => {
		// TODO: "/painting (GET)" e2e 테스트 구현
		// - [x] 공통 로직 구현
		// - [x] 좋은 데이터 테스트
		// - [ ] 나쁜 데이터 테스트 (비유효 query)
		// - [ ] 특수 상황 테스트 ( Huge query.page)

		type SearchQuery = {
			title?: string;
			artistName?: string;
			tags?: string[];
			styles?: string[];
			isS3Access?: boolean;
			page?: number;
		};

		async function searchManyPaintings(query: SearchQuery) {
			const response = await client.GET(ApiPaths.PaintingController_searchMany, {
				params: {
					query,
				},
			});
			return response;
		}

		async function expectSearchedPainting(
			receivedData: Awaited<ReturnType<typeof searchManyPaintings>>["data"],
			query: SearchQuery,
		) {
			expect(receivedData).toBeDefined();

			const {
				title: expectedTitleSubSet,
				artistName: expectedArtist,
				tags: expectedTags,
				styles: expectedStyles,
			} = query;
			const receivedShowPaintings: ShowPainting[] = receivedData!.data;
			const receivedPaintings: Painting[] = await paintingService.getManyByIds(
				receivedShowPaintings.map((showPainting) => showPainting.id),
			);

			assert(receivedShowPaintings.length === receivedPaintings.length);

			if (expectedTitleSubSet) {
				const upperExpectedTitleSubset = expectedTitleSubSet.toUpperCase();
				for (const receivedPainting of receivedPaintings) {
					const upperReceivedTitle = receivedPainting.title.toUpperCase();
					expect(upperReceivedTitle.includes(upperExpectedTitleSubset)).toBe(true);
				}
			}

			if (expectedArtist) {
				for (const receivedPainting of receivedPaintings) {
					const receivedArtist = receivedPainting.artist.name;
					expect(receivedArtist).toBe(expectedArtist);
				}
			}

			if (expectedTags) {
				for (const receivedPainting of receivedPaintings) {
					const receivedTagSet = new Set(receivedPainting.tags.map((t) => t.name));
					for (const expectedTag of expectedTags) {
						expect(receivedTagSet.has(expectedTag)).toBe(true);
					}
				}
			}

			if (expectedStyles) {
				for (const receivedPainting of receivedPaintings) {
					const receivedStyleSet = new Set(receivedPainting.styles.map((s) => s.name));
					for (const expectedStyle of expectedStyles) {
						expect(receivedStyleSet.has(expectedStyle)).toBe(true);
					}
				}
			}
		}

		describe("success when deliver valid query", () => {
			const paintingTitlePrefix = faker.book.title();

			beforeAll(async () => {
				const prefixedPaintingStubs = Array(10)
					.fill(0)
					.map(() => {
						const stub = factoryPaintingStub();
						stub.title = `${paintingTitlePrefix}__${stub.title}`;
						return stub;
					});
				const insertPaintingArgs = prefixedPaintingStubs.map((stub) => {
					const tagCount = 3;
					const styleCount = 3;
					return {
						paintingDummy: stub,
						artist: getRandomElement(_artists)!,
						tags: selectRandomElements(_tags, tagCount),
						styles: selectRandomElements(_styles, styleCount),
					};
				});
				await testService.insertPaintingStubs(insertPaintingArgs);
			});

			describe.each([
				{
					testName: "deliver empty query",
					query: {},
				},
				{
					testName: "deliver valid tags",
					query: {
						tags: _tagStubs.slice(0, 2).map((stub) => stub.name),
					},
				},
				{
					testName: "deliver valid styles",
					query: {
						styles: _styleStubs.slice(0, 2).map((stub) => stub.name),
					},
				},
				{
					testName: "deliver valid artist",
					query: {
						artistName: _artistStubs[0].name,
					},
				},
				{
					testName: "deliver valid title",
					query: {
						title: paintingTitlePrefix,
					},
				},
				{
					testName: "deliver valid title subset",
					query: {
						title: paintingTitlePrefix.slice(0, 3),
					},
				},
				{
					testName: "deliver valid title subset and page",
					query: {
						title: paintingTitlePrefix.slice(0, 3),
						page: 1,
					},
				},
				{
					testName: "deliver artist, title subset, tags, styles",
					query: {
						title: paintingTitlePrefix.slice(0, 3),
						styles: _styleStubs.slice(0, 2).map((stub) => stub.name),
						tags: _tagStubs.slice(0, 2).map((stub) => stub.name),
						artistName: _artistStubs[0].name,
					},
				},
				{
					testName: "deliver not existed tags",
					query: {
						tags: ["not existed tags"],
					},
				},
				{
					testName: "deliver not existed styles",
					query: {
						styles: ["not existed styles"],
					},
				},
				{
					testName: "deliver not existed artistName",
					query: {
						artistName: "not existed artistName",
					},
				},
			])("test : $testName", ({ query }) => {
				let response: Awaited<ReturnType<typeof searchManyPaintings>>;
				beforeAll(async () => {
					response = await searchManyPaintings(query);
				});

				it("response should match openapi spec", () => {
					expect(response.response.status).toBe(HttpStatus.OK);
					const receivedResBody = response.data;
					expect(response.data).toBeDefined();
					expectResponseBody(zPagination(zShowPainting), receivedResBody);
				});
				it("paintings should meet query", async () => {
					const receivedResponseData = response["data"];
					await expectSearchedPainting(receivedResponseData, query);
				});
			});
		});

		describe("success when deliver invalid query handled specially", () => {
			const paintingTitlePrefix = faker.book.title();

			beforeAll(async () => {
				const prefixedPaintingStubs = Array(10)
					.fill(0)
					.map(() => {
						const stub = factoryPaintingStub();
						stub.title = `${paintingTitlePrefix}__${stub.title}`;
						return stub;
					});
				const insertPaintingArgs = prefixedPaintingStubs.map((stub) => {
					const tagCount = 3;
					const styleCount = 3;
					return {
						paintingDummy: stub,
						artist: getRandomElement(_artists)!,
						tags: selectRandomElements(_tags, tagCount),
						styles: selectRandomElements(_styles, styleCount),
					};
				});
				await testService.insertPaintingStubs(insertPaintingArgs);
			});

			/**
			 * @description backed http api follow  form style and explode
			 * @example single query or array query having one element is serialized into `route?key=val1`
			 */
			describe.each([
				{
					testName: "deliver not array tags",
					query: {
						tags: "string type",
					},
				},
				{
					testName: "deliver not array styles",
					query: {
						styles: "string type",
					},
				},
				{
					testName: "deliver array artistName",
					query: {
						artistName: ["array type"],
					},
				},
			])("test : $testName", ({ query }) => {
				let response: Awaited<ReturnType<typeof searchManyPaintings>>;
				beforeAll(async () => {
					response = await searchManyPaintings(query as unknown as SearchQuery);
				});

				it("response should match openapi spec", () => {
					expect(response.response.status).toBe(HttpStatus.OK);
					const receivedResBody = response.data;
					expect(receivedResBody).toBeDefined();
					expectResponseBody(zPagination(zShowPainting), receivedResBody);
				});
				// it("paintings should meet query", async () => {
				// 	const receivedResponseData = response["data"];
				// 	await expectSearchedPainting(receivedResponseData, query);
				// });
			});
		});

		describe("fail when deliver invalid query", () => {
			describe.each([
				{
					testName: "deliver undefined query field",
					invalidQuery: {
						artistName: "not existed artistName",
						notDefinedField: "test",
					},
				},
			])("test : $testName", ({ invalidQuery }) => {
				let response: Awaited<ReturnType<typeof searchManyPaintings>>;
				beforeAll(async () => {
					response = await searchManyPaintings(invalidQuery as SearchQuery);
				});

				it("response should match openapi spec", () => {
					expect(response.response.status).toBe(HttpStatus.BAD_REQUEST);
				});
			});
		});
	});

	describe("/painting/by-ids (GET)", () => {
		// TODO: "/painting/by-ids (GET)" e2e 테스트 구현
		// - [x] 공통 로직 구현
		// - [x] 좋은 데이터 테스트
		// - [x] 나쁜 데이터 테스트 (비유효 query)
		// - [ ] 특수 상황 테스트 ( Huge query.page)
		async function requestGetPaintings(query: { ids: string[] }) {
			const response = await client.GET(ApiPaths.PaintingController_getManyByIds, {
				params: {
					query,
				},
			});

			return response;
		}
		describe("success when deliver valid query", () => {
			const paintingStubs = Array(10)
				.fill(0)
				.map(() => factoryPaintingStub());

			beforeAll(async () => {
				const seedCount = 10;
				const [tags, styles, artists] = await Promise.all([
					testService.seedTags(seedCount),
					testService.seedStyles(seedCount),
					testService.seedArtists(seedCount),
				]);
				const tagCount = 3;
				const styleCount = 3;
				const InsertPaintingArgs = paintingStubs.map((stub) => ({
					paintingDummy: stub,
					artist: getRandomElement(artists)!,
					tags: selectRandomElements(tags, tagCount),
					styles: selectRandomElements(styles, styleCount),
				}));
				await testService.insertPaintingStubs(InsertPaintingArgs);
			});
			describe.each([
				{
					testName: "deliver id",
					query: {
						ids: paintingStubs.map((stub) => stub.id),
					},
				},
			])("test : $testName", ({ query }) => {
				let receivedResponse: Awaited<ReturnType<typeof requestGetPaintings>>;
				beforeAll(async () => {
					receivedResponse = await requestGetPaintings(query);
				});
				it("response should match openapi spec", () => {
					expect(receivedResponse.response.status).toBe(HttpStatus.OK);
					expect(receivedResponse.data).toBeDefined();
					const receivedResBody = receivedResponse.data!;
					expectResponseBody(z.array(zShowPaintingResponse), receivedResBody);
				});
			});
		});

		describe("fail when deliver invalid query", () => {
			beforeAll(async () => {
				await testService.seedPaintings(10);
			});
			describe.each([
				{
					testName: "deliver empty ids",
					invalidQuery: {
						ids: [],
					},
				},
				{
					testName: "deliver invalid format ids",
					invalidQuery: {
						ids: [faker.internet.jwt()],
					},
				},
			])("test : $testName", ({ invalidQuery }) => {
				let receivedResponse: Awaited<ReturnType<typeof requestGetPaintings>>;
				beforeAll(async () => {
					receivedResponse = await requestGetPaintings(invalidQuery);
				});
				it("response should match openapi spec", () => {
					expect(receivedResponse.response.status).toBe(HttpStatus.BAD_REQUEST);
				});
			});
		});
	});
	describe("/painting (POST)", () => {
		// TODO: "/painting (POST)" e2e 테스트 구현
		// - [x] 공통 로직 구현
		// - [x] 좋은 데이터 테스트
		// - [x] 나쁜 데이터 테스트 (비유효 body)
		// - [x] 비권한 사용자 요청 테스트 ( 일반 사용자)
		// - [ ] 비권한 사용자 요청 테스트 ( 삭제된 사용자 )
		// - [ ] 특수 상황 테스트 ( Huge query.page)
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

		async function requestCreatePainting(body: CreatePaintingDto, admin: User) {
			const adminAuthorization = testService.getBearerAuthCredential(admin);
			const response = await client.POST(ApiPaths.PaintingController_createPainting, {
				params: {
					header: {
						authorization: adminAuthorization,
					},
				},
				body,
			});
			return response;
		}

		async function expectCreatePainting(
			receivedResBody: Awaited<ReturnType<typeof requestCreatePainting>>["data"],
			requestBody: CreatePaintingDto,
		) {
			assert(receivedResBody);
			const expectedBody = requestBody;
			const receivedPainting = (await paintingService.findOne({
				where: { id: receivedResBody?.id },
			}))!;

			expect(receivedPainting).toBeDefined();

			const receivedTagNames = sortByLocale(receivedPainting.tags.map((t) => t.name));
			const expectedTagNames = sortByLocale(expectedBody.tags);
			expect(receivedTagNames).toEqual(expectedTagNames);

			const receivedStyleNames = sortByLocale(receivedPainting.styles.map((s) => s.name));
			const expectedStyleNames = sortByLocale(expectedBody.styles);
			expect(receivedStyleNames).toEqual(expectedStyleNames);

			const receivedArtistName = receivedPainting.artist.name ?? undefined;
			expect(receivedArtistName).toBe(expectedBody.artistName);

			const receivedCompletitionYear = receivedPainting.completition_year ?? undefined;
			expect(receivedCompletitionYear).toBe(expectedBody.completition_year);

			const columns = [
				"title",
				"image_url",
				"description",
				"width",
				"height",
				"image_s3_key",
			] as const;

			expect(pick(receivedPainting, columns)).toEqual(pick(expectedBody, columns));
		}

		describe("success when deliver valid body dto", () => {
			let admin: User;
			beforeAll(async () => {
				[admin] = await testService.seedUsersSingleInsert(1, "admin");
			});

			describe.each([
				{
					testName: "deliver without relations tags,styles",
					body: {
						...factoryBaseCreateDto(),
						tags: [],
						styles: [],
						artistName: _artistStubs[0].name,
					},
				},
				{
					testName: "deliver valid body",
					body: {
						...factoryBaseCreateDto(),
						artistName: _artistStubs[0].name,
						tags: _tagStubs.map((stub) => stub.name),
						styles: _styleStubs.map((stub) => stub.name),
					},
				},
			])("test : $testName", ({ body }) => {
				let receivedRes: Awaited<ReturnType<typeof requestCreatePainting>>;

				beforeAll(async () => {
					receivedRes = await requestCreatePainting(body, admin);
				});

				it("response should match openapi", () => {
					expect(receivedRes.response.status).toBe(HttpStatus.CREATED);
					expect(receivedRes.data).toBeDefined();
					expectResponseBody(zShowPainting, receivedRes.data);
				});

				it("entity should be created", async () => {
					const receivedResBody = receivedRes.data!;

					const expectedPainting = await paintingService.findOne({
						where: { id: receivedResBody.id },
					});
					expect(expectedPainting).toBeDefined();
					await expectCreatePainting(receivedResBody, body);
				});
			});
		});

		describe("fail when deliver invalid body dto", () => {
			let admin: User;
			beforeAll(async () => {
				[admin] = await testService.seedUsersSingleInsert(1, "admin");
			});

			describe.each([
				{
					testName: "deliver invalid Tags",
					invalidBody: {
						...factoryBaseCreateDto(),
						styles: [_styleStubs[0].name],
						artistName: _artistStubs[0].name,
						tags: [faker.book.title() + faker.internet.email()],
					},
				},
				{
					testName: "deliver invalid styles",
					invalidBody: {
						...factoryBaseCreateDto(),
						tags: [_tagStubs[0].name],
						artistName: _artistStubs[0].name,
						styles: [faker.book.title() + faker.internet.email()],
					},
				},
				{
					testName: "deliver invalid artistName",
					invalidBody: {
						...factoryBaseCreateDto(),
						styles: [_styleStubs[0].name],
						tags: [_tagStubs[0].name],
						artistName: faker.book.title() + faker.internet.email(),
					},
				},
				{
					testName: "deliver omit field",
					invalidBody: {
						styles: [_styleStubs[0].name],
						artistName: _artistStubs[0].name,
					},
				},
			])("test : $testName", ({ invalidBody }) => {
				let receivedRes: Awaited<ReturnType<typeof requestCreatePainting>>;

				beforeAll(async () => {
					receivedRes = await requestCreatePainting(
						invalidBody as CreatePaintingDto,
						admin,
					);
				});

				it("response should match openapi", () => {
					expect(receivedRes.response.status).toBe(HttpStatus.BAD_REQUEST);
				});
			});
		});

		describe("fail when request by unauthorized user", () => {
			const userStub = factoryUserStub("user");
			beforeAll(async () => {
				await testService.insertStubUser(userStub);
			});

			describe.each([
				{
					testName: "deliver normal user",
					userId: userStub.id,
					body: {
						...factoryBaseCreateDto(),
						styles: [_styleStubs[0].name],
						artistName: _artistStubs[0].name,
						tags: [_tagStubs[0].name],
					},
				},
			])("test : $testName", ({ body, userId }) => {
				let receivedRes: Awaited<ReturnType<typeof requestCreatePainting>>;

				beforeAll(async () => {
					const user = await userService.findOne({ where: { id: userId } });
					assert(user);
					receivedRes = await requestCreatePainting(body, user!);
				});

				it("response should match openapi", () => {
					expect(receivedRes.response.status).toBe(HttpStatus.FORBIDDEN);
				});
			});
		});
	});

	describe("/painting/:id (PUT)", () => {
		// TODO: "/painting/:id (PUT)" e2e 테스트 구현
		// - [x] 공통 로직 구현
		// - [x] 좋은 데이터 테스트
		// - [x] 나쁜 데이터 테스트 (비유효 body, 비유효 id path)
		// - [x] 비권한 사용자 요청 테스트
		// - [ ] 특수 상황 테스트 ( Huge query.page)
		function transformToReplaceDto(
			paintingStub: PaintingDummy,
			tagStubs: TagDummy[],
			styleStubs: StyleDummy[],
			artistStub: ArtistDummy,
		): ReplacePaintingDto {
			const dto = {
				tags: tagStubs.map((stub) => stub.name),
				styles: styleStubs.map((stub) => stub.name),
				completition_year: paintingStub.completition_year!,
				title: paintingStub.title,
				image_url: paintingStub.image_url,
				description: paintingStub.description,
				width: paintingStub.width,
				height: paintingStub.height,
				image_s3_key: paintingStub.image_s3_key,
				artistName: artistStub.name,
			};

			return dto;
		}

		async function requestReplacePainting(id: string, body: ReplacePaintingDto, admin: User) {
			const authorization = testService.getBearerAuthCredential(admin);
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

		async function expectReplacePainting(
			receivedResBody: Awaited<ReturnType<typeof requestReplacePainting>>["data"],
			requestBody: ReplacePaintingDto,
		) {
			assert(receivedResBody);
			const expectedBody = requestBody;
			const receivedPainting = (await paintingService.findOne({
				where: { id: receivedResBody!.id },
			}))!;

			expect(receivedPainting).toBeDefined();

			const receivedTagNames = sortByLocale(receivedPainting.tags.map((t) => t.name));
			const expectedTagNames = sortByLocale(expectedBody.tags);
			expect(receivedTagNames).toEqual(expectedTagNames);

			const receivedStyleNames = sortByLocale(receivedPainting.styles.map((s) => s.name));
			const expectedStyleNames = sortByLocale(expectedBody.styles);
			expect(receivedStyleNames).toEqual(expectedStyleNames);

			const receivedArtistName = receivedPainting.artist.name ?? undefined;
			expect(receivedArtistName).toBe(expectedBody.artistName);

			const receivedCompletitionYear = receivedPainting.completition_year ?? undefined;
			expect(receivedCompletitionYear).toBe(expectedBody.completition_year);

			const columns = [
				"title",
				"image_url",
				"description",
				"width",
				"height",
				"image_s3_key",
			] as const;

			expect(pick(receivedPainting, columns)).toEqual(pick(expectedBody, columns));
		}
		describe("success when deliver valid dto by admin", () => {
			const paintingStubs = Array(5)
				.fill(0)
				.map(() => factoryPaintingStub());
			const tagsIndexRange = [0, 2];
			const stylesIndexRange = [0, 2];
			const artistIndex = 0;
			let admin: User;
			beforeAll(async () => {
				const insertPaintingArgs = paintingStubs.map((stub) => ({
					paintingDummy: stub,
					tags: _tags.slice(tagsIndexRange[0], tagsIndexRange[1]),
					styles: _styles.slice(stylesIndexRange[0], stylesIndexRange[1]),
					artist: _artists[artistIndex],
				}));
				await testService.insertPaintingStubs(insertPaintingArgs);
				[admin] = await testService.seedUsersSingleInsert(1, "admin");
			});

			describe.each([
				{
					testName: "deliver updated relation fields",
					id: paintingStubs[0].id,
					body: {
						...transformToReplaceDto(
							paintingStubs[0],
							_tagStubs.slice(tagsIndexRange[0], tagsIndexRange[1] + 1),
							_styleStubs.slice(stylesIndexRange[0], stylesIndexRange[1] + 1),
							_artistStubs[1],
						),
					},
				},
				{
					testName: "deliver updated title ",
					id: paintingStubs[1].id,
					body: {
						...transformToReplaceDto(
							paintingStubs[1],
							_tagStubs.slice(tagsIndexRange[0], tagsIndexRange[1] + 1),
							_styleStubs.slice(stylesIndexRange[0], stylesIndexRange[1] + 1),
							_artistStubs[0],
						),
						title: "update title ",
					},
				},
			])("test : $testName", ({ id, body }) => {
				let receivedRes: Awaited<ReturnType<typeof requestReplacePainting>>;

				beforeAll(async () => {
					receivedRes = await requestReplacePainting(id, body, admin);
				});

				it("response should match openapi spec", () => {
					expect(receivedRes.response.status).toBe(HttpStatus.OK);
					expect(receivedRes).toBeDefined();
					const receivedResBody = receivedRes.data;
					expectResponseBody(zShowPaintingResponse, receivedResBody);
				});

				it("entity should be updated", async () => {
					const receivedData = receivedRes.data!;
					await expectReplacePainting(receivedData, body);
				});
			});
		});

		describe("fail when deliver invalid dto or id by admin", () => {
			const paintingStubs = Array(5)
				.fill(0)
				.map(() => factoryPaintingStub());
			let admin: User;
			beforeAll(async () => {
				const insertPaintingArgs = paintingStubs.map((stub) => ({
					paintingDummy: stub,
					tags: selectRandomElements(_tags, 2),
					styles: selectRandomElements(_styles, 2),
					artist: getRandomElement(_artists)!,
				}));
				await testService.insertPaintingStubs(insertPaintingArgs);
				[admin] = await testService.seedUsersSingleInsert(1, "admin");
			});

			describe.each([
				{
					testName: "deliver invalid id",
					invalidId: faker.string.uuid(),
					invalidBody: {
						...transformToReplaceDto(
							paintingStubs[0],
							_tagStubs.slice(0, 3),
							_styleStubs.slice(0, 3),
							_artistStubs[0],
						),
					},
				},
				{
					testName: "deliver invalid tags",
					invalidId: paintingStubs[0].id,
					invalidBody: {
						...transformToReplaceDto(
							paintingStubs[0],
							_tagStubs.slice(0, 3),
							_styleStubs.slice(0, 3),
							_artistStubs[0],
						),
						tags: ["invalid_tag"],
					},
				},
				{
					testName: "deliver empty body",
					invalidId: paintingStubs[0].id,
					invalidBody: {},
				},
			])("test : $testName", ({ invalidId, invalidBody }) => {
				let receivedRes: Awaited<ReturnType<typeof requestReplacePainting>>;

				beforeAll(async () => {
					receivedRes = await requestReplacePainting(
						invalidId,
						invalidBody as ReplacePaintingDto,
						admin,
					);
				});

				it("response should match openapi spec", () => {
					expect(receivedRes.response.status).toBe(HttpStatus.BAD_REQUEST);
				});
			});
		});

		describe("fail when request by user", () => {
			const paintingStubs = Array(5)
				.fill(0)
				.map(() => factoryPaintingStub());
			const userStub = factoryUserStub("user");
			beforeAll(async () => {
				const insertPaintingArgs = paintingStubs.map((stub) => ({
					paintingDummy: stub,
					tags: selectRandomElements(_tags, 2),
					styles: selectRandomElements(_styles, 2),
					artist: getRandomElement(_artists)!,
				}));
				await testService.insertPaintingStubs(insertPaintingArgs);
				await testService.insertStubUser(userStub);
			});

			describe.each([
				{
					testName: "deliver normal userId",
					userId: userStub.id,
					id: paintingStubs[0].id,
					body: {
						...transformToReplaceDto(
							paintingStubs[0],
							_tagStubs.slice(0, 3),
							_styleStubs.slice(0, 3),
							_artistStubs[0],
						),
					},
				},
			])("test : $testName", ({ id, body, userId }) => {
				let receivedRes: Awaited<ReturnType<typeof requestReplacePainting>>;

				beforeAll(async () => {
					const user = (await userService.findOne({ where: { id: userId } }))!;
					receivedRes = await requestReplacePainting(
						id,
						body as ReplacePaintingDto,
						user,
					);
				});

				it("response should match openapi spec", () => {
					expect(receivedRes.response.status).toBe(HttpStatus.FORBIDDEN);
				});
			});
		});

		describe("/painting/:id (DELETE)", () => {
			// TODO: "/painting/:id (PUT)" e2e 테스트 구현
			// - [x] 공통 로직 구현
			// - [x] 좋은 데이터 테스트
			// - [x] 나쁜 데이터 테스트 (비유효 body, 비유효 id path)
			// - [ ] 비권한 사용자 요청 테스트
			// - [ ] 특수 상황 테스트 ( Huge query.page)
			async function requestDeletePainting(id: string, admin: User) {
				const route = ApiPaths.PaintingController_deletePainting;
				const adminAuthorization = testService.getBearerAuthCredential(admin);
				const response = await client.DELETE(route, {
					params: {
						path: {
							id,
						},
						header: {
							authorization: adminAuthorization,
						},
					},
				});
				return response;
			}

			describe("success when deliver valid id path", () => {
				const paintingStubs = Array(10)
					.fill(0)
					.map(() => factoryPaintingStub());
				let admin: User;
				beforeAll(async () => {
					const insertPaintingArgs = paintingStubs.map((stub) => ({
						paintingDummy: stub,
						tags: selectRandomElements(_tags, 2),
						styles: selectRandomElements(_styles, 2),
						artist: getRandomElement(_artists)!,
					}));
					await testService.insertPaintingStubs(insertPaintingArgs);
					[admin] = await testService.seedUsersSingleInsert(1, "admin");
				});

				describe.each([{ testName: "deliver valid id", id: paintingStubs[0].id }])(
					`test : $testName`,
					({ id }) => {
						let receivedRes: Awaited<ReturnType<typeof requestDeletePainting>>;
						beforeAll(async () => {
							receivedRes = await requestDeletePainting(id, admin);
						});

						it("response should match openapi spec", () => {
							expect(receivedRes.response.status).toBe(HttpStatus.OK);
						});

						it("entity should be deleted", async () => {
							const receivedEntity = await paintingService.findOne({ where: { id } });
							expect(receivedEntity).toBe(null);
						});
					},
				);
			});

			describe("fail when deliver invalid id path", () => {
				const paintingStubs = Array(10)
					.fill(0)
					.map(() => factoryPaintingStub());
				const deletedPaintingStub = factoryPaintingStub();
				let admin: User;
				beforeAll(async () => {
					const insertPaintingArgs = paintingStubs.map((stub) => ({
						paintingDummy: stub,
						tags: selectRandomElements(_tags, 2),
						styles: selectRandomElements(_styles, 2),
						artist: getRandomElement(_artists)!,
					}));
					await testService.insertPaintingStubs(insertPaintingArgs);
					[admin] = await testService.seedUsersSingleInsert(1, "admin");

					const [deletedPainting] = await testService.insertPaintingStubs([
						{
							paintingDummy: deletedPaintingStub,
							tags: selectRandomElements(_tags, 2),
							styles: selectRandomElements(_styles, 2),
							artist: getRandomElement(_artists)!,
						},
					]);
					const qr = dbService.getQueryRunner();
					await paintingService.deleteOne(qr, deletedPainting);
					await qr.release();
				});

				describe.each([
					{
						testName: "deliver invalid format id",
						invalidId: "invalid-format",
					},
					{ testName: "deliver not exist id", invalidId: faker.string.uuid() },
					{
						testName: "deliver deleted id",
						invalidId: deletedPaintingStub.id,
					},
				])(`test : $testName`, ({ invalidId }) => {
					let receivedRes: Awaited<ReturnType<typeof requestDeletePainting>>;
					beforeAll(async () => {
						receivedRes = await requestDeletePainting(invalidId, admin);
					});

					it("response should match openapi spec", () => {
						expect(receivedRes.response.status).toBe(HttpStatus.BAD_REQUEST);
					});
				});
			});

			describe("fail when request by unauthorized user", () => {
				const paintingStubs = Array(10)
					.fill(0)
					.map(() => factoryPaintingStub());
				const userStub = factoryUserStub("user");
				beforeAll(async () => {
					const insertPaintingArgs = paintingStubs.map((stub) => ({
						paintingDummy: stub,
						tags: selectRandomElements(_tags, 2),
						styles: selectRandomElements(_styles, 2),
						artist: getRandomElement(_artists)!,
					}));
					await testService.insertPaintingStubs(insertPaintingArgs);

					await testService.insertStubUser(userStub);
				});

				describe.each([
					{
						testName: "request by normal user",
						id: paintingStubs[0].id,
						userId: userStub.id,
					},
				])(`test : $testName`, ({ id, userId }) => {
					let receivedRes: Awaited<ReturnType<typeof requestDeletePainting>>;
					beforeAll(async () => {
						const user = await userService.findOne({ where: { id: userId } });
						assert(user !== null);
						receivedRes = await requestDeletePainting(id, user!);
					});

					it("response should match openapi spec", () => {
						expect(receivedRes.response.status).toBe(HttpStatus.FORBIDDEN);
					});

					it("entity should be not deleted", async () => {
						const receivedEntity = await paintingService.findOne({ where: { id } });
						expect(receivedEntity).toBeDefined();
					});
				});
			});
		});
	});
});
