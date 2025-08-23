import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { AppModule } from "../../../src/app.module";

import * as request from "supertest";
import TestAgent from "supertest/lib/agent";
import { DatabaseService } from "../../../src/modules/db/db.service";
import { Painting } from "../../../src/modules/painting/entities/painting.entity";
import { Repository } from "typeorm";
import { DataBaseModule } from "../../../src/modules/db/db.module";

describe("PaintingController (e2e)", () => {
	let app: INestApplication;
	let repo: Repository<Painting>;
	// TODO 테스트 환경 설정하기
	// [ ] nest.js APP 인스턴스 생성
	// [ ] nest.js APP 인스턴스 설정(global pipe, Module, .env.test)
	// [ ] 테스트 DB 연결
	// [ ] 테스트 DB 데이터정의
	// [ ] 테스트 DB 데이터 삽입 로직 추가
	// [ ] 테스트 DB 데이터 삭제 로직
	// [x] 테스트 종료후 APP 인스턴스 종료

	beforeEach(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [AppModule],
		}).compile();

		app = moduleFixture.createNestApplication();

		await app.init();
	});

	afterAll(async () => {
		await app.close();
	});

	beforeEach(async () => {});

	describe("200: /painting (GET)", () => {
		it("기본 /painting/", async () => {
			const response = await request(app.getHttpServer() as TestAgent)
				.get("/painting")
				.query({
					page: 0,
				})
				.expect(200);

			expect(response.body.data).toBeDefined();
			expect(response.body.data.length).toBe(5);
		});
		it("tag로 그림 search", async () => {
			return request(app.getHttpServer())
				.get("/painting/")
				.query({
					"tags[]": ["Ballet dancer"], // []에 원소가 2개 이상이면  tags: [{원소1}, {원소2}] 사용 가능
				})
				.expect(200)
				.expect((res) => {
					// 응답 데이터에서 title 확인
					expect(res.body.data[0].title).toBe("The Ballet Class");
				});
		});

		it("200: title로 그림 search", async () => {
			return request(app.getHttpServer())
				.get("/painting/")
				.query({
					title: "Bo",
				})
				.expect(200)
				.expect((res) => {
					// 응답 데이터에서 title 확인
					expect(res.body.data[0].title).toBe("Boy in a Red Vest");
					expect(res.body.data[1].title).toBe("Boulevard of Capucines");
				});
		});
	});
	describe("/painting/by-ids (GET)", () => {
		it("200: ID로 그림 조회 성공 및 title 확인", async () => {
			return request(app.getHttpServer())
				.get("/painting/by-ids")
				.query({
					ids: [
						"3772cae7-b6fd-4a6a-a02b-1b8513bc528f",
						"a428de3c-46b9-4425-9e4a-628ffbecaaa3",
					], // []에 원소가 1개면  "ids[]"": [{원소1}] 사용 가능
				})
				.expect(200)
				.expect((res) => {
					// 응답 데이터에서 title 확인
					expect(res.body[0].title).toBe("The Ballet Class");
					expect(res.body[1].title).toBe("Boy in a Red Vest");
				});
		});
		it("400: ID로 그림 조회 실패 UUID 아님", async () => {
			return request(app.getHttpServer())
				.get("/painting/by-ids")
				.query({
					ids: ["3772cae78f", "becaaa3"], // []에 원소가 1개면  "ids[]"": [{원소1}] 사용 가능
				})
				.expect(400)
				.expect((res) => {
					// 응답 데이터에서 title 확인
					expect(res.body.message[0]).toBe("each value in ids must be a UUID");
				});
		});
	});
});
