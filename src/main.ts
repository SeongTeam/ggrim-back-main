import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { QuizScheduleService } from './quiz/quiz-schedule.service';
import { winstonLogger } from './utils/winston.config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    logger: winstonLogger,
  });
  const quizScheduleService = app.get(QuizScheduleService);
  quizScheduleService.initialize();
  await app.listen(3000);
}
bootstrap();
