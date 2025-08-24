/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { AppModule } from "../../../src/app.module";

import * as request from "supertest";
import { DatabaseService } from "../../../src/modules/db/db.service";
import { configNestApp } from "../../../src/app.config";
import { EntityManager } from "typeorm";
import { Artist } from "../../../src/modules/artist/entities/artist.entity";
import { getArtistStubList } from "../artist/artist.stub";
import { getPaintingStubList } from "./painting.stub";
import { getTagStubList } from "../tag/tag.stub";
import { getStyleStubList } from "../style/style.stub";
import { Tag } from "../../../src/modules/tag/entities/tag.entity";
import { Style } from "../../../src/modules/style/entities/style.entity";
import { Painting } from "../../../src/modules/painting/entities/painting.entity";
import { Pagination } from "../../../src/modules/_common/types";
import {
	ShowPainting,
	ShowPaintingResponse,
} from "../../../src/modules/painting/dto/response/showPainting.response";

enum TEST_CASE {
	BASE = 0,
}

const artistStub = getArtistStubList()[TEST_CASE.BASE];
const paintingStub = getPaintingStubList()[TEST_CASE.BASE];
const tagStubList = getTagStubList();
const styleStub = getStyleStubList()[TEST_CASE.BASE];

async function insertTestData(manager: EntityManager) {
	const artist = (await manager.insert(Artist, artistStub)).generatedMaps[0];
	const tags = (await manager.insert(Tag, tagStubList)).generatedMaps.slice(0);
	const style = (await manager.insert(Style, styleStub)).generatedMaps[0];

	const painting = manager.create(Painting, { ...paintingStub, artist, tags, styles: [style] });
	await manager.save(painting);
}

describe("PaintingController (e2e)", () => {
	let app: INestApplication;
	let dbService: DatabaseService;
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
			imports: [AppModule],
			providers: [DatabaseService],
		}).compile();

		app = moduleFixture.createNestApplication();
		configNestApp(app);
		await app.init();

		dbService = moduleFixture.get(DatabaseService);

		await dbService.resetDB();
		await insertTestData(dbService.getManager());
	});

	afterAll(async () => {
		await dbService.resetDB();
		await app.close();
	});

	it("그림 검색 ", async () => {
		const response = await request(app.getHttpServer())
			.get("/painting")
			.query({
				page: 0,
			})
			.expect(200);

		expect((response.body as Pagination<ShowPainting>).data).toBeDefined();
	});
	it("그림 검색(복수 tag 사용)", async () => {
		return request(app.getHttpServer())
			.get("/painting/")
			.query({
				"tags[]": [tagStubList[0].name, tagStubList[1].name], // []에 원소가 2개 이상이면  tags: [{원소1}, {원소2}] 사용 가능
			})
			.expect(200)
			.expect((res) => {
				// 응답 데이터에서 title 확인
				expect((res.body as Pagination<ShowPainting>).data[0].title).toBe(
					paintingStub.title,
				);
			});
	});

	it("그림검색( title 필터)", async () => {
		return request(app.getHttpServer())
			.get("/painting/")
			.query({
				title: paintingStub.title.slice(0, 3),
			})
			.expect(200)
			.expect((res) => {
				// 응답 데이터에서 title 확인
				expect((res.body as Pagination<ShowPainting>).data[0].title).toBe(
					paintingStub.title,
				);
			});
	});
	it("ID로 그림 검색", async () => {
		return request(app.getHttpServer())
			.get("/painting/by-ids")
			.query({
				ids: [paintingStub.id], // []에 원소가 1개면  "ids[]"": [{원소1}] 사용 가능
			})
			.expect(200)
			.expect((res) => {
				// 응답 데이터에서 title 확인
				expect((res.body as ShowPaintingResponse[])[0].title).toBe(paintingStub.title);
			});
	});
	it("ID 그림 검색 실패(validator 검증)", async () => {
		return request(app.getHttpServer())
			.get("/painting/by-ids")
			.query({
				ids: ["3772cae78f", "becaaa3"], // []에 원소가 1개면  "ids[]"": [{원소1}] 사용 가능
			})
			.expect(400)
			.expect((res) => {
				// 응답 데이터에서 title 확인
				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
				expect(res.body.message[0]).toBe("each value in ids must be a UUID");
			});
	});
});
