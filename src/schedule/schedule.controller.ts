import { Controller, Inject } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { LoggerService } from '../Logger/logger.service';
import { QuizService } from '../quiz/quiz.service';

const QUIZ_VIEW_MAP_FLUSH_INTERVAL_MS: number = 10 * 60 * 1000;
@Controller('schedule')
export class ScheduleController {
  constructor(
    @Inject(QuizService) private readonly quizService: QuizService,
    @Inject(LoggerService) private readonly logger: LoggerService,
  ) {}

  @Interval(QUIZ_VIEW_MAP_FLUSH_INTERVAL_MS)
  async flushQuizViewMap() {
    this.logger.log('call flushViewMap(). schedule start', { className: ScheduleController.name });
    await this.quizService.flushViewMap();
  }
}
