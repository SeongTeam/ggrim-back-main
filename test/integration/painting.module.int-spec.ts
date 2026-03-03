import { Test, TestingModule } from "@nestjs/testing";
import { PaintingModule } from "../../src/modules/painting/painting.module";
import { PaintingService } from "../../src/modules/painting/painting.service";
import { TestModule } from "../_shared/test.module";
import { TestService } from "../_shared/test.service";
import { DatabaseService } from "../../src/modules/db/db.service";
import { QuizModule } from "../../src/modules/quiz/quiz.module";
import { ClsModule } from "nestjs-cls";
import { assert } from "console";

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

		assert(testService);
	});

	it("should be defined", () => {
		expect(paintingService).toBeDefined();
	});
});
