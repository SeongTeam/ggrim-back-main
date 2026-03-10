import { Test, TestingModule } from "@nestjs/testing";
import { HttpStatus, INestApplication } from "@nestjs/common";
import { AppModule } from "../../src/app.module";
import createClient from "openapi-fetch";
import { ApiPaths, paths } from "../generated/dto-types";

describe("AppController (e2e)", () => {
	let app: INestApplication;
	const port = 3001;
	const client = createClient<paths>({ baseUrl: `http://localhost:${port}` });

	beforeAll(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [AppModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		await app.init();
		await app.listen(port);
	});

	describe("/ (GET)", () => {
		async function requestGetHello() {
			const route = ApiPaths.AppController_getHello;
			const response = await client.GET(route);

			return response;
		}

		it("response should match the OpenAPI documentation. ", async () => {
			const receivedRes = await requestGetHello();
			const receivedStatus = receivedRes.response.status;
			const receivedBody = receivedRes.data;
			expect(receivedStatus).toBe(HttpStatus.OK);
			expect(receivedBody).toEqual(["Hello World!"]);
		});
	});

	afterAll(async () => {
		await app.close();
	});
});
