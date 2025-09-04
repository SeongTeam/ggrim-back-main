import { forwardRef, Inject, Injectable, Logger } from "@nestjs/common";
import { Mutex } from "async-mutex";

import { isArrayEmpty } from "../../../utils/validator";

import { QuizSubmission } from "./type";
import { QuizService } from "../quiz.service";
@Injectable()
export class QuizBatchService {
	private viewMap = new Map<string, number>();
	private submissionMap = new Map<string, QuizSubmission>();
	private viewMapMutex = new Mutex();
	private submissionMapMutex = new Mutex();
	constructor(@Inject(forwardRef(() => QuizService)) private quizService: QuizService) {}

	// TODO : statistic Map 기능 개선
	// [ ] : Nodejs 최대 정수값(2^53-1) overflow 고려하기
	// [ ] : Update Query에 대해 트랜잭션 고려하기.
	//  -> 트랜잭션으로 묶는 것보다, 별도의 쿼리를 여러개 보내서 병렬적으로 처리하는게 더 효과적이지 않을까?
	// [x] : 앱 종료 훅 시점에, 플러시 실패에 대응 로직 추가하기
	// [ ] : 시스템 확장시, CONNECTION_POOL_SIZE 증가도 고려하기
	//  -> : MAX CONNECTION POOL 등의 앱 메모리 및 리소스 관리 고려할 것
	// [ ] : Quiz Flush 로직 통합 또는 Redis 사용 고려하기

	async flushViewMap() {
		const CONNECTION_POOL_SIZE = 5;
		const buffer: [string, number][] = await this.viewMapMutex.runExclusive(() => {
			const arr = Array.from(this.viewMap.entries());
			this.viewMap.clear();
			return arr;
		});
		const failed: [string, number][] = [];
		Logger.log(`[flushViewMap]start flush. size : ${buffer.length}`, QuizService.name);

		const groupCount = Math.ceil(buffer.length / CONNECTION_POOL_SIZE);

		for (let i = 0; i < groupCount; i++) {
			const start = i * CONNECTION_POOL_SIZE;
			const end = (i + 1) * CONNECTION_POOL_SIZE;
			const queries = buffer.slice(start, end);

			const results = await Promise.allSettled(
				queries.map(([id, number]) => this.quizService.increaseViewCount(id, number)),
			);
			results.forEach((result, index) => {
				if (result.status === "rejected") {
					Logger.error(
						`flushViewMap() failed to increment id=${queries[index][0]}: ${result.reason}`,
						QuizService.name,
					);
					failed.push(queries[index]);
				}
			});
		}

		Logger.log(`[flushViewMap] end flush. failed_size : ${failed.length}`, QuizService.name);

		if (!isArrayEmpty(failed)) {
			await this.viewMapMutex.runExclusive(() => {
				failed.forEach(([id, count]) => {
					const current = this.viewMap.get(id) || 0;
					this.viewMap.set(id, current + count);
				});
			});
		}
	}

	async flushSubmissionMap() {
		const CONNECTION_POOL_SIZE = 5;
		const buffer: [string, QuizSubmission][] = await this.submissionMapMutex.runExclusive(
			() => {
				const arr = Array.from(this.submissionMap.entries());
				this.submissionMap.clear();
				return arr;
			},
		);
		const failed: [string, QuizSubmission][] = [];

		Logger.log(`[flushSubmissionMap]start flush. size : ${buffer.length}`, QuizService.name);
		const groupCount = Math.ceil(buffer.length / CONNECTION_POOL_SIZE);

		for (let i = 0; i < groupCount; i++) {
			const start = i * CONNECTION_POOL_SIZE;
			const end = (i + 1) * CONNECTION_POOL_SIZE;
			const queries = buffer.slice(start, end);

			const results = await Promise.allSettled(
				queries.map(([id, submission]) =>
					this.quizService.increaseSubmission(id, submission),
				),
			);

			results.forEach((result, index) => {
				if (result.status === "rejected") {
					Logger.error(
						`flushSubmissionMap() failed to increment id=${queries[index][0]}: ${result.reason}`,
						QuizService.name,
					);
					failed.push(queries[index]);
				}
			});
		}

		Logger.log(
			`[flushSubmissionMap] end flush. failed_size : ${failed.length}`,
			QuizService.name,
		);

		if (!isArrayEmpty(failed)) {
			await this.submissionMapMutex.runExclusive(() => {
				failed.forEach(([id, submission]) => {
					const current = this.submissionMap.get(id) ?? new QuizSubmission();
					const next = {
						correct_count: current.correct_count + submission.correct_count,
						incorrect_count: current.incorrect_count + submission.incorrect_count,
					};
					this.submissionMap.set(id, next);
				});
			});
		}
	}
	async insertSubmission(id: string, isCorrect: boolean): Promise<void> {
		await this.submissionMapMutex.runExclusive(() => {
			const current: QuizSubmission = this.submissionMap.get(id) ?? new QuizSubmission();
			const key: keyof QuizSubmission = isCorrect ? "correct_count" : "incorrect_count";

			current[key] += 1;

			this.submissionMap.set(id, current);
		});
	}

	async isViewMapEmpty(): Promise<boolean> {
		return await this.viewMapMutex.runExclusive(() => this.viewMap.size === 0);
	}

	async isSubmissionMapEmpty(): Promise<boolean> {
		return await this.submissionMapMutex.runExclusive(() => this.submissionMap.size === 0);
	}

	async insertView(id: string): Promise<void> {
		await this.viewMapMutex.runExclusive(() => {
			const current = this.viewMap.get(id) || 0;
			this.viewMap.set(id, current + 1);
		});
	}
}
