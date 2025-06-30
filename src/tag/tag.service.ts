import { TypeOrmCrudService } from "@dataui/crud-typeorm";
import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { InsertResult, Repository } from "typeorm";
import { ServiceException } from "../_common/filter/exception/service/service-exception";
import { Batch } from "../utils/batch";
import { isArrayEmpty } from "../utils/validator";
import { CreateTagDTO } from "./dto/request/create-tag.dto";
import { Tag } from "./entities/tag.entity";

interface UpdateRequest<T, R> {
	httpMethod: string;
	dto: T;
	handler: PromiseHandler<R>;
}

interface PromiseHandler<R> {
	resolve: (result: R) => void;
	reject: (exception: ServiceException) => void;
}

@Injectable()
export class TagService extends TypeOrmCrudService<Tag> {
	/*TODO 
      - QUEUE_LIMIT와 BATCH_INTERVAL_MS을 트래픽에 따라 변경하기
        예시) 요청량 증가시, QUEUE_LIMIT 증가, 요청량 감소시 BATCH_INTERVAL_MS 감소
    */
	private readonly creatingBatch = new Batch<CreateTagDTO, Tag>({
		queueLimit: 40,
		batchIntervalMs: 4000,
		generateDtoToID: (dto) => `name:${dto.name}`,
		processBatch: this.processCreateBatch.bind(this),
	});
	constructor(@InjectRepository(Tag) readonly repo: Repository<Tag>) {
		super(repo);
	}

	insertCreateDtoToQueue<T extends CreateTagDTO>(dto: T): Promise<Tag> {
		return this.creatingBatch.addToQueue(dto, "CREATE");
	}

	filterUniqueDTOs(dtoList: CreateTagDTO[]): CreateTagDTO[] {
		const uniqueDTOsMap = new Map<string, CreateTagDTO>();

		for (const dto of dtoList) {
			if (!uniqueDTOsMap.has(dto.name)) {
				uniqueDTOsMap.set(dto.name, dto);
			}
		}

		return [...uniqueDTOsMap.values()];
	}

	async findManyByName(names: string[]): Promise<Tag[]> {
		if (isArrayEmpty(names)) {
			return [];
		}

		const tags = await this.repo
			.createQueryBuilder("tag")
			.where("tag.name IN (:...names)", { names })
			.getMany();

		return tags;
	}

	async getTagsRelatedToPainting() {
		const query = this.repo
			.createQueryBuilder("t")
			.innerJoin("t.paintings", "painting")
			.select(["t.name", "t.id"]);

		Logger.debug(query.getSql());

		return await query.getMany();
	}

	async processCreateBatch(
		dtoToResultMap: Map<CreateTagDTO, Tag | ServiceException>,
	): Promise<void> {
		const uniqueDTOs = Array.from(dtoToResultMap.keys());
		const uniqueNames = uniqueDTOs.map((dto) => dto.name);

		try {
			const existingTags: Tag[] = await this.findManyByName(uniqueNames);
			const existingNameMap: Map<string, Tag> = new Map(
				existingTags.map((tag) => [tag.name, tag]),
			);
			const dtoListToCreate: CreateTagDTO[] = uniqueDTOs.filter(
				(dto) => !existingNameMap.has(dto.name),
			);

			const newTags = await this.createTags(dtoListToCreate);
			const allTags = [...existingTags, ...newTags];
			for (const tag of allTags) {
				const keyDto = uniqueDTOs.find((dto) => tag.name === dto.name)!;
				if (existingNameMap.has(tag.name)) {
					const serviceException = new ServiceException(
						"DB_CONFLICT",
						"CONFLICT",
						`Tag ${tag.name} is already exist`,
					);
					dtoToResultMap.set(keyDto, serviceException);
					continue;
				}

				dtoToResultMap.set(keyDto, tag);
			}
		} catch (error) {
			Logger.error(`[processCreateBatch] ${JSON.stringify(error!)}`);
			uniqueDTOs.forEach((dto) => {
				const serviceException = new ServiceException(
					"SERVICE_RUN_ERROR",
					"INTERNAL_SERVER_ERROR",
					`Create Tag ${dto.name} fail `,
					{ cause: error },
				);
				dtoToResultMap.set(dto, serviceException);
			});
		}

		return;
	}

	//TODO typeorm 로직 개선
	// [ ] : returning() 메소드를 사용하여 생성 후 반환되는 열들의 값 명시하기
	//  -> insertResult.generateMaps[0]은 직접삽입한 값은 포함되지 않기 때문에 returning() 적용필요.
	async createTags(dtoList: CreateTagDTO[]): Promise<Tag[]> {
		if (!isArrayEmpty(dtoList)) {
			const createdTags = await this.repo.manager.transaction<Tag[]>(
				async (transactionalEntityManager) => {
					const result: InsertResult = await transactionalEntityManager
						.getRepository(Tag)
						.createQueryBuilder()
						.insert()
						.values(dtoList)
						.returning("*")
						.execute();

					return result.generatedMaps as Tag[];
				},
			);
			return createdTags;
		}
		return [];
	}
}
