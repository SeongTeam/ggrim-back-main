import { forwardRef, Inject, Injectable, Logger } from "@nestjs/common";
import { Mutex, MutexInterface, withTimeout } from "async-mutex";
import { ServiceException } from "../_common/filter/exception/service/serviceException";
import { LoggerService } from "../logger/logger.service";
import { QuizContext } from "./interface/quizContext";

type QuizContextID = string;

interface ContextHashNode {
	schedulerIndex: number;
	scheduleCount: number;
	isFixed: boolean;
	context: QuizContext;
}

type ContextHashMap = Map<QuizContextID, ContextHashNode>;

@Injectable()
export class QuizScheduleService {
	private SCHEDULER_SIZE = 10;
	private SCHEDULER_EMPTY = "SCHEDULER_EMPTY";
	private MUTEX_TIMEOUT_MS = 10000;
	private OPTIMIZE_INTERVAL_MS = 600000;
	private _scheduler: QuizContextID[];
	private _contextHashMap = new Map<string, ContextHashNode>();
	private _schedulerIdx: number;
	private mutex: MutexInterface;
	private optimizerTimer: NodeJS.Timeout | null;

	// TODO forwardRef 사용법 공식문서 정확히 읽기 적용하기
	constructor(@Inject(forwardRef(() => LoggerService)) private readonly logger: LoggerService) {
		Logger.log("construct class", QuizScheduleService.name);
		this._contextHashMap = new Map<string, ContextHashNode>();
		this._scheduler = new Array(this.SCHEDULER_SIZE).fill(this.SCHEDULER_EMPTY);
		this._schedulerIdx = 0;
		this.mutex = withTimeout(
			new Mutex(),
			this.MUTEX_TIMEOUT_MS,
			new ServiceException(
				"SERVICE_RUN_TIMEOUT",
				"INTERNAL_SERVER_ERROR",
				`[${QuizScheduleService.name}]Timeout Mutex  Release ${this.MUTEX_TIMEOUT_MS}`,
			),
		);
		this.optimizerTimer = null;
	}

	async initialize(fixedContexts: QuizContext[]) {
		if (fixedContexts.length > this.SCHEDULER_SIZE) {
			//해당 로그는 사용자 요청과 관련없으므로 Logger를 사용
			Logger.error(`init fail. ` + `${JSON.stringify(fixedContexts, null, 2)}`);
			throw new Error(
				`fixedContext length is over max this._scheduler size` +
					`this.SCHEDULER_SIZE : ${this.SCHEDULER_SIZE} `,
			);
		}
		await this.mutex.runExclusive(() => {
			this.addContexts(fixedContexts, true);

			this.logger.assertOrLog(this._scheduler.length !== 0);
		});
	}

	async requestDeleteContext(context: QuizContext) {
		const contextID = this.transformHashKey(context);

		return await this.mutex.runExclusive(() => {
			if (this._contextHashMap.has(contextID)) {
				return this.deleteContext(contextID);
			}
			return false;
		});
	}

	// TODO: 스케줄링 균형성 향상
	// - [ ] 사용자가 중복하여 Context를 전달받지 않도록 로직 향상 필요
	//  -> 단, 사용자가 충분히 존재하거나 데이터가 충분히 많으면 고려 할것.
	// - [ ] <추가 작업>
	// ! 주의: <경고할 사항>
	// ? 질문: <의문점 또는 개선 방향>
	// * 참고: <관련 정보나 링크>

	async scheduleContext(): Promise<QuizContext> {
		let idx = this._schedulerIdx;
		let loop = 0;
		const size = this.SCHEDULER_SIZE;

		await this.mutex.acquire();
		try {
			do {
				idx = (idx + 1) % size;
				loop++;
			} while (loop < size && this._scheduler[idx] === this.SCHEDULER_EMPTY);

			if (loop == size && this._scheduler[idx] === this.SCHEDULER_EMPTY) {
				const e = new Error(`No Context exist`);
				this.logger.error(
					`[${QuizScheduleService.name}] this._schedulerIdx : ${this._schedulerIdx}` +
						`${JSON.stringify(this._contextHashMap, null, 2)}` +
						`${JSON.stringify(this._scheduler, null, 2)}`,
					e.stack || "",
					{
						className: QuizScheduleService.name,
					},
				);
				throw e;
			}

			const id: QuizContextID = this._scheduler[idx];

			// TODO: assert 로직 개선
			// - [x] production/dev 모드에 따라 assert 동작 다르게하기
			//  -> js에선 production 빌드시 assert가 함께 컴파일되므로, production에서는 에러로그가 발생하도록 해야한다.
			// - [ ] <추가 작업>
			// ! 주의: <경고할 사항>
			// ? 질문: <의문점 또는 개선 방향>
			// * 참고: <관련 정보나 링크>
			this.logger.assertOrLog(this._contextHashMap.has(id), `schedule context must exist`);

			if (!this._contextHashMap.has(id)) {
				const e = Error(`${id} is not in hashMap`);
				this.logger.error(
					`[${QuizScheduleService.name}] this._schedulerIdx : ${this._schedulerIdx}` +
						`${JSON.stringify(this._contextHashMap, null, 2)}` +
						`${JSON.stringify(this._scheduler, null, 2)}`,
					e.stack || "",
					{
						className: QuizScheduleService.name,
					},
				);
				throw e;
			}

			this._schedulerIdx = idx;

			const node: ContextHashNode = this._contextHashMap.get(id)!;
			node.scheduleCount++;
			this.logger.assertOrLog(
				this._schedulerIdx === node.schedulerIndex,
				`Should synchronize idx and node's index` +
					`this._schedulerIdx : ${this._schedulerIdx}` +
					`${JSON.stringify(node, null, 2)}`,
			);

			return node.context;
		} finally {
			this.mutex.release();
		}
	}

	async requestAddContext(contexts: QuizContext[]): Promise<boolean> {
		return this.mutex.runExclusive(() => {
			const result = this.addContexts(contexts, false);
			this.logger.log(`[${QuizScheduleService.name}] requestAddContext() completes request`, {
				className: QuizScheduleService.name,
			});
			return result;
		});
	}

	async requestUpdateFixedQuiz(newContexts: QuizContext[]): Promise<boolean> {
		if (newContexts.length === 0) {
			this.logger.warn(`[${QuizScheduleService.name}] can't update empty array`, {
				className: QuizScheduleService.name,
			});
			return false;
		}

		const hashMap = new Map<QuizContextID, QuizContext>();
		newContexts.forEach((ctx) => hashMap.set(this.transformHashKey(ctx), ctx));

		if (hashMap.size > this.SCHEDULER_SIZE) {
			this.logger.warn(
				`[${QuizScheduleService.name}] updateFixedContexts() failed. Not Enough Size.` +
					`${JSON.stringify(hashMap, null, 2)}` +
					`${JSON.stringify(newContexts, null, 2)}`,
				{
					className: QuizScheduleService.name,
				},
			);
			// throw new Error(`updateFixedContexts() failed. Not Enough Size`);
			return false;
		}
		// main
		await this.mutex.acquire();

		//백업
		const _contextHashMapBackup: ContextHashMap = structuredClone(this._contextHashMap);
		const _schedulerBackup: QuizContextID[] = structuredClone(this._scheduler);

		try {
			//resize with backup

			this._scheduler.forEach((id) => {
				if (this._contextHashMap.has(id)) {
					this._contextHashMap.get(id)!.isFixed = false;
				} else {
					//혹시모를 에러 방지용.
					const e = new Error("System state is wrong. need to check");
					this.logger.error(
						`[${QuizScheduleService.name}] Scheduled ID should save Hash Node. please check add & delete logic. \n` +
							`id : ${id}` +
							`this._schedulerIdx : ${this._schedulerIdx}}`,
						e.stack || "",
						{
							className: QuizScheduleService.name,
						},
					);
					throw e;
				}
			});

			let existCount = 0;
			hashMap.forEach((ctx, id) => {
				if (this._contextHashMap.has(id)) {
					this._contextHashMap.get(id)!.isFixed = true;
					existCount++;
				}
			});

			const emptyCount = this.getEmptyIndex()!.length;
			const tryCount = emptyCount - existCount;
			const nodes: ContextHashNode[] = [...this._contextHashMap.values()];
			this.sortByLowPriority(nodes);

			for (let i = 0; i < tryCount; i++) {
				const deleteID = this.transformHashKey(nodes[0].context);
				if (this.deleteContext(deleteID)) {
					throw new Error(
						`Can't delete Context during updating fixed Context. ID : ${deleteID}`,
					);
				}
			}
			//re-arrange

			const targets: QuizContext[] = [];
			hashMap.forEach((ctx, id) => {
				if (!this._contextHashMap.has(id)) {
					targets.push(ctx);
				}
			});
			return this.addContexts(targets, true);
		} catch (e: unknown) {
			if (e instanceof Error) {
				this.logger.error(
					`fail requestAddContext().error : ${JSON.stringify(e)}\n`,
					e.stack || "",
					{
						className: QuizScheduleService.name,
					},
				);
				this._contextHashMap = _contextHashMapBackup;
				this._scheduler = _schedulerBackup;
				return false;
			} else {
				throw e;
			}
		} finally {
			this.logger.log(`requestAddContext().finish\n`, {
				className: QuizScheduleService.name,
			});
			await this.mutex.release();
		}
	}

	startOptimization(interval = this.OPTIMIZE_INTERVAL_MS) {
		if (this.optimizerTimer) return;
		this.optimizerTimer = setInterval(() => {
			this.optimize();
		}, interval);
	}

	stopOptimization() {
		if (this.optimizerTimer) {
			clearInterval(this.optimizerTimer);
			this.optimizerTimer = null;
		}
	}

	async requestDeleteLowPriority(): Promise<boolean> {
		return this.mutex.runExclusive(() => {
			const hashNodes: ContextHashNode[] = [...this._contextHashMap.values()].filter(
				(node) => node.isFixed,
			);

			this.sortByLowPriority(hashNodes);

			const contextID: QuizContextID = hashNodes.map((ctx) =>
				this.transformHashKey(ctx.context),
			)[0];

			return this.deleteContext(contextID);
		});
	}

	/*
  * return 
       - true : success add or already exist
       - false : fail add without already exist
  */

	private addContexts(contexts: QuizContext[], isFixed: boolean = false): boolean {
		if (!this.mutex.isLocked()) {
			return false;
		}

		const tempMap: ContextHashMap = new Map();
		contexts.forEach((context) =>
			tempMap.set(this.transformHashKey(context), {
				context,
				scheduleCount: 0,
				schedulerIndex: -1,
				isFixed,
			}),
		);

		const emptyIndexes: number[] = this.getEmptyIndex()!;

		if (emptyIndexes.length < tempMap.size) {
			this.logger.warn(`[${QuizScheduleService.name}] Need to optimize. `, {
				className: QuizScheduleService.name,
			});
			return false;
		}

		const tasks = [...tempMap.values()].map((node) => ({
			node,
			status: "FAILED" as "ADDED" | "EXISTED" | "FAILED",
		}));

		const backupHashMap: ContextHashMap = new Map(this._contextHashMap);

		try {
			tasks.forEach((task, idx) => {
				const schedulerIndex = emptyIndexes[idx];
				const id: QuizContextID = this.transformHashKey(task.node.context);

				if (this._contextHashMap.has(id)) {
					//중복 삽입 예방.
					task.status = "EXISTED";
					this.logger.log(`[${QuizScheduleService.name}] Already Exist ID. ID : ${id}`, {
						className: QuizScheduleService.name,
					});
					return;
				}

				this._scheduler[schedulerIndex] = id;
				task.node.schedulerIndex = schedulerIndex;
				this._contextHashMap.set(this.transformHashKey(task.node.context), {
					...task.node,
				});
				task.status = "ADDED";
			});
			return true;
		} catch (e: unknown) {
			// rollback when error
			const statistic = tasks.reduce(
				(acc, { status }) => ({ ...acc, [status]: acc[status] + 1 }),
				{} as { ADDED: 0; EXISTED: 0; FAILED: 0 } as Record<
					"ADDED" | "EXISTED" | "FAILED",
					number
				>,
			);
			if (e instanceof Error) {
				this.logger.error(
					`[${QuizScheduleService.name}] fail addContext.` +
						`${JSON.stringify(statistic, null, 2)}`,
					e.stack || "",
					{
						className: QuizScheduleService.name,
					},
				);
				this._contextHashMap = backupHashMap;
				return false;
			} else {
				throw e;
			}
		} finally {
			this.logger.log(
				`[${QuizScheduleService.name}] addContext finish` +
					`${JSON.stringify(tasks, null, 2)}`,
				{
					className: QuizScheduleService.name,
				},
			);
		}
	}

	private getEmptyIndex(): number[] | undefined {
		if (!this.mutex.isLocked()) {
			return undefined;
		}

		const emptyIndexes: number[] = [];
		this._scheduler.forEach((value, index) => {
			if (value === this.SCHEDULER_EMPTY) {
				emptyIndexes.push(index);
			}
		});
		return emptyIndexes;
	}

	private getScheduleCount(): number | undefined {
		if (!this.mutex.isLocked()) {
			return undefined;
		}
		let count = 0;
		this._scheduler.forEach((value) => {
			if (value !== this.SCHEDULER_EMPTY) {
				count++;
			}
		});

		return count;
	}

	//Should acquire mutex before call it
	private deleteContext(contextID: QuizContextID): boolean {
		if (!this.mutex.isLocked()) {
			this.logger.warn(`can't execute without acquiring mutex `, {
				className: QuizScheduleService.name,
			});
			return false;
		}

		if (!this._contextHashMap.has(contextID)) {
			this.logger.assertOrLog(false, `can't delete not-existed ID. ${contextID}`);
		}

		const deletedNode: ContextHashNode = this._contextHashMap.get(contextID)!;

		this._contextHashMap.delete(contextID);
		this._scheduler[deletedNode.schedulerIndex] = this.SCHEDULER_EMPTY;
		return true;
	}

	private async report(): Promise<void> {
		await this.mutex.acquire();
		this.logger.log(
			`[${QuizScheduleService.name}] report schedule status : ${
				(JSON.stringify({
					_scheduler: this._scheduler,
					_contextHashMap: this._contextHashMap,
					_schedulerIdx: this._schedulerIdx,
					fixedCtxCount: this.getFixedContextCounts()!,
				}),
				null,
				2)
			}`,
			{
				className: QuizScheduleService.name,
			},
		);

		await this.mutex.release();
	}

	private transformHashKey(context: QuizContext): QuizContextID {
		const temp: QuizContext = {
			tag: context.tag?.trim(),
			artist: context.artist?.trim(),
			style: context.style?.trim(),
			page: context.page,
		};

		return `${temp.artist}-${temp.tag}-${temp.style}-${temp.page}`;
	}

	private async optimize(): Promise<void> {
		const count = await this.getScheduleCount();
		if (count === this.SCHEDULER_SIZE) {
			this.logger.log(`[${QuizScheduleService.name}] delete low priority context`, {
				className: QuizScheduleService.name,
			});
			await this.requestDeleteLowPriority();
		}

		await this.report();

		// TODO: 스케줄러 최적화 기능 향상
		// - [ ] 추가된 기능에 맞는 최적화 또는 GC 로직 추가하기
		//  -> <할 일 > 설명 ( 생략가능 )
		// - [ ] <추가 작업>
		// ! 주의: <경고할 사항>
		// ? 질문: <의문점 또는 개선 방향>
		// * 참고: <관련 정보나 링크>
		this.logger.log(`[${QuizScheduleService.name}] optimize complete`, {
			className: QuizScheduleService.name,
		});
		return;
	}

	private sortByLowPriority(hashNodes: ContextHashNode[]): ContextHashNode[] {
		const temp: ContextHashNode[] = [...hashNodes];
		return temp.sort((a, b) => {
			if (b.scheduleCount === a.scheduleCount) {
				//나중에 선택될 Context 제거
				return (
					this.getSchedulingOffset(b.schedulerIndex) -
					this.getSchedulingOffset(a.schedulerIndex)
				);
			}
			// 가장 많이 선택된 Context 제거
			return b.scheduleCount - a.scheduleCount;
		});
	}

	private getFixedContextCounts(): number | undefined {
		if (this.mutex.isLocked()) {
			return undefined;
		}
		let count = 0;

		this._scheduler.forEach((id) => {
			this.logger.assertOrLog(
				this._contextHashMap.has(id),
				"scheduled context ID should has context node",
			);
			if (this._contextHashMap.get(id)!.isFixed) {
				count++;
			}
		});
		return count;
	}

	private getSchedulingOffset(index: number) {
		return (index - this._schedulerIdx + this.SCHEDULER_SIZE) % this.SCHEDULER_SIZE;
	}
}
