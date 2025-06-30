import { Logger } from "@nestjs/common";
import { ServiceException } from "../_common/filter/exception/service/serviceException";
import { isArrayEmpty } from "./validator";

type MethodType = "UPDATE" | "CREATE" | "DELETE";
export interface BatchRequest<DTO, Entity> {
	id: string;
	method: MethodType;
	dto: DTO;
	handler: PromiseHandler<Entity>;
}

interface PromiseHandler<R> {
	resolve: (result: R) => void;
	reject: (exception: ServiceException) => void;
}

interface BatchConfig<DTO, Entity> {
	queueLimit: number;
	batchIntervalMs: number;
	generateDtoToID: (dto: DTO) => string;
	processBatch: (dtoToResultMap: Map<DTO, Entity | ServiceException>) => Promise<void>;
}
/*설계 사양
- 모든 Create,Update,Delete Request에 대해 Batch 로직 기능을 제공
- Batch 로직 기본 기능은 다음과 같다.
    1. 큐에 요청을 삽입
    2. 주기적으로 큐에 있는 요청을 한번에 처리
    3. 큐의 크기가 일정 수준을 넘어가면, 요청을 한번에 처리
    4. 각 요청에 대한 처리 결과 반환.
        - 즉, 중복된 요청들은 각각 동일한 결과를 받는다.
        - 에러가 발생한 요청은 에러를 받는다.
- Batch 로직은 다음 설정이 필요
    - [x]어떻게 중복 요청을 판단하는가?
    - [x]요청들을 처리하는 로직을 어떻게 받을 것인가?
    - [x]어떻게 각 요청들을 식별할 것인가?
    - [x]어떻게 주기를 설정할 것인가
    - [x]어떻게 큐 크기를 설정할 것인가?
    */
/*TODO
    - Batch 로직에서, 각 Http Request를 식별할 필요가 있는가?
    */
export class Batch<DTO, Entity> {
	private readonly queue: BatchRequest<DTO, Entity>[] = [];
	private isProcessing: boolean = false;
	private batchTimer: NodeJS.Timeout | null = null;

	constructor(private readonly config: BatchConfig<DTO, Entity>) {}

	addToQueue(dto: DTO, method: MethodType): Promise<Entity> {
		return new Promise((resolve, reject) => {
			const request: BatchRequest<DTO, Entity> = {
				id: this.config.generateDtoToID(dto),
				dto,
				method,
				handler: { resolve, reject },
			};
			this.queue.push(request);

			if (this.queue.length >= this.config.queueLimit) {
				this.clearBatchTimer();
				this.executeBatch();
				return;
			}

			if (!this.batchTimer) {
				// setTimeOut 타이머를 관리하여, 이미 설정된 타이머가 있으면 새로 설정하지 말기.
				this.batchTimer = setTimeout(() => {
					this.clearBatchTimer();
					this.executeBatch();
				}, this.config.batchIntervalMs);
			}
			return;
		});
	}

	private clearBatchTimer(): void {
		if (this.batchTimer) {
			clearTimeout(this.batchTimer);
			this.batchTimer = null;
		}
	}

	private async executeBatch(): Promise<void> {
		if (this.isProcessing || isArrayEmpty(this.queue)) {
			return;
		}

		this.isProcessing = true;

		const batch: BatchRequest<DTO, Entity>[] = [...this.queue];
		this.queue.splice(0, this.queue.length);
		try {
			const itemHashMap: Map<string, BatchRequest<DTO, Entity>[]> = new Map();
			batch.forEach((item) => {
				if (!itemHashMap.has(item.id)) {
					itemHashMap.set(item.id, []);
				}
				itemHashMap.get(item.id)?.push(item);
			});

			const dtoToResultMap: Map<DTO, Entity | ServiceException> = new Map();

			itemHashMap.forEach((value) => {
				const request: BatchRequest<DTO, Entity> = value.at(0)!;
				const defaultResult = new ServiceException(
					"ENTITY_CREATE_FAILED",
					"INTERNAL_SERVER_ERROR",
					`[executeBatch] Fail to process BatchRequest.\n`,
				);
				dtoToResultMap.set(request.dto, defaultResult);
			});

			await this.config.processBatch(dtoToResultMap);

			this.emitBatchResults(dtoToResultMap, itemHashMap);
		} catch (error) {
			this.handleBatchError(batch, error);
		} finally {
			this.isProcessing = false;
		}
	}

	private handleBatchError(batch: BatchRequest<DTO, Entity>[], error: unknown) {
		const serviceException = new ServiceException(
			"SERVICE_RUN_ERROR",
			"INTERNAL_SERVER_ERROR",
			`Failed to process Batch Request.`,
			{ cause: error },
		);
		for (const { handler } of batch) {
			handler.reject(serviceException);
		}
	}

	private emitBatchResults(
		dtoToResultMap: Map<DTO, Entity | ServiceException>,
		itemHashMap: Map<string, BatchRequest<DTO, Entity>[]>,
	) {
		dtoToResultMap.forEach((valueResult, keyDto) => {
			const hashKey = this.config.generateDtoToID(keyDto);

			if (!itemHashMap.has(hashKey)) {
				Logger.error(
					`[executeBatch] invalid key : ${hashKey}\n` +
						`${JSON.stringify({ keyDto, valueResult })}`,
				);
				throw new ServiceException(
					"SERVICE_RUN_ERROR",
					"INTERNAL_SERVER_ERROR",
					`invalid dto from processing batch. ${JSON.stringify(keyDto)}\n` +
						`should check ${this.config.processBatch.name}() or ${this.config.generateDtoToID.name}() logic`,
				);
			}
			const response: Entity | ServiceException = valueResult;
			const requests: BatchRequest<DTO, Entity>[] = itemHashMap.get(hashKey)!;
			for (const request of requests) {
				if (response instanceof ServiceException) {
					request.handler.reject(response);
					continue;
				}
				request.handler.resolve(response);
			}
		});
	}
}
