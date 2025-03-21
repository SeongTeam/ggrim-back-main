import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { QuizController } from './quiz/quiz.controller';
import { winstonLogger } from './utils/winston.config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    logger: winstonLogger,
  });
  //initialize Providers
  const quizController = app.get(QuizController);
  quizController.initialize();

  await app.listen(3000);
}
bootstrap();
