import { Controller, Inject } from "@nestjs/common";
import { Interval } from "@nestjs/schedule";
import { LoggerService } from "../logger/logger.service";
import { QuizBatchService } from "../quiz/batch/quiz.batch.service";

const QUIZ_VIEW_MAP_FLUSH_INTERVAL_MS: number = 10 * 60 * 1000;
const QUIZ_SUBMISSION_MAP_FLUSH_INTERVAL_MS: number = 10 * 60 * 1000;
@Controller("schedule")
export class ScheduleController {
	constructor(
		@Inject(QuizBatchService) private readonly quizBatchService: QuizBatchService,
		@Inject(LoggerService) private readonly logger: LoggerService,
	) {}

	@Interval(QUIZ_VIEW_MAP_FLUSH_INTERVAL_MS)
	async flushQuizViewMap() {
		this.logger.log("call flushViewMap(). schedule start", {
			className: ScheduleController.name,
		});
		await this.quizBatchService.flushViewMap();
	}

	@Interval(QUIZ_SUBMISSION_MAP_FLUSH_INTERVAL_MS)
	async flushQuizSubmissionMap() {
		this.logger.log("call flushQuizSubmissionMap(). schedule start", {
			className: ScheduleController.name,
		});

		try {
			await this.quizBatchService.flushSubmissionMap();
		} catch (error) {
			this.logger.logUnknownError("fail schedule QuizSubmissionMap", error, {
				className: ScheduleController.name,
			});
		}
	}
}
