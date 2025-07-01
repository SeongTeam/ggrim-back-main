import { ConfigModule } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { MockRepository } from "../../../test/_shared/mock/mock.repository";
import { Painting } from "./entities/painting.entity";
import { PaintingService } from "./painting.service";

describe("PaintingService", () => {
	let service: PaintingService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [
				ConfigModule.forRoot({
					envFilePath: ".env.test.local",
				}),
			],
			providers: [
				PaintingService,
				{
					provide: getRepositoryToken(Painting),
					useValue: new MockRepository<Painting>(),
				},
			],
		}).compile();

		service = module.get<PaintingService>(PaintingService);
	});

	it("should be defined", () => {
		expect(service).toBeDefined();
	});
});
