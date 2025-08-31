import { Test, TestingModule } from "@nestjs/testing";
import { PaintingModule } from "../../src/modules/painting/painting.module";
import { PaintingService } from "../../src/modules/painting/painting.service";
import { TestModule } from "../_shared/test.module";
import { TestService } from "../_shared/test.service";
import { DatabaseService } from "../../src/modules/db/db.service";
import { FactoryArtistStub } from "../_shared/stub/artist.stub";
import { factoryPaintingStub } from "../_shared/stub/painting.stub";
import { QuizModule } from "../../src/modules/quiz/quiz.module";
import { ClsModule } from "nestjs-cls";

describe("PaintingModule Integration Test", () => {
	let module: TestingModule;
	let paintingService: PaintingService;
	let testService: TestService;
	let dbService: DatabaseService;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				TestModule,
				PaintingModule,
				ClsModule.forRoot({
					global: true,
					interceptor: {
						mount: true,
					},
				}),
				QuizModule,
			],
		}).compile();

		paintingService = module.get<PaintingService>(PaintingService);
		testService = module.get<TestService>(TestService);
		dbService = module.get<DatabaseService>(DatabaseService);
		await dbService.resetDB();
	});

	it("should be defined", () => {
		expect(paintingService).toBeDefined();
	});

	it("insert painting : 성공", async () => {
		const artist = await testService.insertArtistStub(FactoryArtistStub());
		const painting = await testService.insertPaintingStub(
			factoryPaintingStub(),
			artist,
			[],
			[],
		);

		const result = await paintingService.findPainting(painting.id);

		expect(result).toEqual(painting);
	});
});
