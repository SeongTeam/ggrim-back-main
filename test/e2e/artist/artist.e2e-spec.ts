import { HttpStatus, INestApplication } from "@nestjs/common";
import { DatabaseService } from "../../../src/modules/db/db.service";
import { TestService } from "../../_shared/test.service";
import { ArtistService } from "../../../src/modules/artist/artist.service";
import { User } from "../../../src/modules/user/entity/user.entity";
import { ApiPaths, CreateArtistDto, paths } from "../../generated/dto-types";
import createClient from "openapi-fetch";
import { Test, TestingModule } from "@nestjs/testing";
import { AppModule } from "../../../src/app.module";
import { TestModule } from "../../_shared/test.module";
import { configNestApp } from "../../../src/app.config";
import { factoryUserStub } from "../../_shared/stub/user.stub";
import { factoryArtistStub } from "../../_shared/stub/artist.stub";
import { Artist } from "../../../src/modules/artist/entities/artist.entity";
import { pick } from "../../../src/utils/object";
import { ShowArtistResponse } from "../../../src/modules/artist/dto/response/showArtist.response";
import { expectResponseBody } from "../_common/jest-zod";
import { zShowArtist, zShowArtistResponse } from "./zodSchema";
import { CondOperator, RequestQueryBuilder } from "@dataui/crud-request";
import { zPagination } from "../_common/zodSchema";

if (process.env.VSCODE_INSPECTOR_OPTIONS) {
	console.log("Set setTimeout for debugging");
	jest.setTimeout(60 * 1000 * 10); // 10 minutes
}

describe("ArtistController (e2e)", () => {
	let app: INestApplication;
	let dbService: DatabaseService;
	let testService: TestService;
	let artistService: ArtistService;
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
		artistService = moduleFixture.get(ArtistService);
		await dbService.resetDB();
		user = await testService.insertStubUser(factoryUserStub("user"));
		admin = await testService.insertStubUser(factoryUserStub("admin"));

		await app.listen(port);
	});

	afterAll(async () => {
		//await dbService.resetDB();
		await app.close();
	});

	describe("/artist (POST)", () => {
		async function requestCreateArtist(dto: CreateArtistDto, authorization: string) {
			const result = await client.POST(ApiPaths.createOneBaseArtistControllerArtist, {
				params: {
					header: {
						authorization,
					},
				},
				body: dto,
			});

			return result;
		}

		describe("success when create artist by admin", () => {
			let dto: CreateArtistDto;
			let expectedArtistSubset: Pick<
				Artist,
				"birth_date" | "name" | "death_date" | "image_url" | "info_url"
			>;
			let response: Awaited<ReturnType<typeof requestCreateArtist>>;
			let receivedArtist: Artist;
			beforeAll(async () => {
				const artistStub = factoryArtistStub();
				dto = {
					name: artistStub.name,
					birth_date: artistStub.birth_date?.toISOString(),
					death_date: artistStub.death_date?.toISOString(),
					image_url: artistStub.image_url ? artistStub.image_url : undefined,
					info_url: artistStub.info_url ? artistStub.info_url : undefined,
				};
				expectedArtistSubset = {
					name: artistStub.name,
					birth_date: artistStub.birth_date,
					death_date: artistStub.death_date,
					image_url: artistStub.image_url,
					info_url: artistStub.info_url,
				};

				const authorization = testService.getBearerAuthCredential(admin);
				response = await requestCreateArtist(dto, authorization);
				receivedArtist = (await artistService.findOne({
					where: { name: expectedArtistSubset.name },
				}))!;
			});

			it("response status should be Created", () => {
				expect(response.response.status).toBe(HttpStatus.CREATED);
			});

			it("artist should be created", () => {
				expect(receivedArtist).toBeDefined();
				expect(
					pick(receivedArtist!, [
						"name",
						"birth_date",
						"death_date",
						"image_url",
						"info_url",
					]),
				).toEqual(expectedArtistSubset);
			});

			it("response should match to spec", () => {
				const expectedRes = new ShowArtistResponse(receivedArtist);
				const receivedRes = response.data;
				expectResponseBody(zShowArtistResponse, receivedRes);
				expect(receivedRes).toEqual(expectedRes);
			});
		});

		describe("fail when create artist by user", () => {
			let dto: CreateArtistDto;
			let expectedArtistSubset: Pick<
				Artist,
				"birth_date" | "name" | "death_date" | "image_url" | "info_url"
			>;
			let response: Awaited<ReturnType<typeof requestCreateArtist>>;
			let receivedArtist: Artist;
			beforeAll(async () => {
				const artistStub = factoryArtistStub();
				dto = {
					name: artistStub.name,
					birth_date: artistStub.birth_date?.toISOString(),
					death_date: artistStub.death_date?.toISOString(),
					image_url: artistStub.image_url ? artistStub.image_url : undefined,
					info_url: artistStub.info_url ? artistStub.info_url : undefined,
				};
				expectedArtistSubset = {
					name: artistStub.name,
					birth_date: artistStub.birth_date,
					death_date: artistStub.death_date,
					image_url: artistStub.image_url,
					info_url: artistStub.info_url,
				};

				const authorization = testService.getBearerAuthCredential(user);
				response = await requestCreateArtist(dto, authorization);
				receivedArtist = (await artistService.findOne({
					where: { name: expectedArtistSubset.name },
				}))!;
			});

			it("response status should be FORBIDDEN", () => {
				expect(response.response.status).toBe(HttpStatus.FORBIDDEN);
			});

			it("artist should not be created", () => {
				expect(receivedArtist).toBeNull();
			});
		});
	});

	describe("/artist (GET)", () => {
		async function getManyArtist(queryBuilder: RequestQueryBuilder) {
			const result = await client.GET(ApiPaths.getManyBaseArtistControllerArtist, {
				params: {
					query: queryBuilder.queryObject,
				},
			});

			return result;
		}

		describe("success when search artists by name without Lower/Upper case", () => {
			let response: Awaited<ReturnType<typeof getManyArtist>>;
			const artistStubs = Array(40)
				.fill(0)
				.map(() => factoryArtistStub());
			const query = {
				field: "search_name",
				operator: CondOperator.STARTS,
				value: artistStubs[0].name.slice(0, 2).toLocaleUpperCase(),
			};
			beforeAll(async () => {
				await testService.insertArtistStubs(artistStubs);

				const qb = RequestQueryBuilder.create();
				const pageCount = 10;
				const page = 0;
				qb.select(["name"])
					.setFilter(query)
					.sortBy({ field: "search_name", order: "ASC" })
					.setLimit(pageCount)
					.setPage(page);
				response = await getManyArtist(qb);
			});

			it("response status should be ok", () => {
				expect(response.response.status).toBe(HttpStatus.OK);
			});

			it("response should match to spec", () => {
				const receivedRes = response.data;
				expect(receivedRes).toBeDefined();
				expectResponseBody(zPagination(zShowArtist), receivedRes);
			});

			it("artist should match to filter condition", () => {
				const receivedRes = response.data;

				const artists = receivedRes!.data;

				expect(artists.length).toBeGreaterThanOrEqual(1);

				for (const artist of artists) {
					expect(artist.name).toMatch(new RegExp(`^${query.value}`, "i"));
				}
			});
		});
	});
});
