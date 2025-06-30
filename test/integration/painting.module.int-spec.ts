import { Test, TestingModule } from "@nestjs/testing";
import { CreatePaintingDTO } from "../../src/painting/dto/request/create-painting.dto";
import { PaintingModule } from "../../src/painting/painting.module";
import { PaintingService } from "../../src/painting/painting.service";
import { TestModule } from "../_shared/test.module";
import { TestService } from "../_shared/test.service";

describe("PaintingModule Integration Test", () => {
	let module: TestingModule;
	let paintingService: PaintingService;
	let testService: TestService;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [TestModule, PaintingModule],
		}).compile();

		paintingService = module.get<PaintingService>(PaintingService);
		testService = module.get<TestService>(TestService);
		await testService.initTest();
	});

	afterAll(async () => {
		await testService.cleanAll();
		await testService.closeTest();
	});

	it("should be defined", () => {
		expect(paintingService).toBeDefined();
	});

	it("should success create", async () => {
		const dto: CreatePaintingDTO = {
			title: "unit-test",
			image_url: "test",
			description: "test",
		};
		const result = await paintingService.create(dto);

		expect(result).toBeTruthy();
	});
});
