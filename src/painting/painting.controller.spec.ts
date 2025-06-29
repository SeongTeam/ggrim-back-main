import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { MockRepository } from "../../test/_shared/mock/mock.repository";
import { Painting } from "./entities/painting.entity";
import { PaintingController } from "./painting.controller";
import { PaintingService } from "./painting.service";

describe("PaintingController", () => {
	let controller: PaintingController;
	let service: PaintingService;
	let paintingRepository: MockRepository<Painting> = new MockRepository<Painting>();

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [PaintingController],
			providers: [
				PaintingService,
				{ provide: getRepositoryToken(Painting), useValue: paintingRepository },
			],
		}).compile();

		controller = module.get<PaintingController>(PaintingController);
		service = module.get<PaintingService>(PaintingService);
		paintingRepository = module.get<MockRepository<Painting>>(getRepositoryToken(Painting));
	});

	it("should be defined", () => {
		expect(controller).toBeDefined();
	});
});
