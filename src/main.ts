import { ClassSerializerInterceptor, INestApplication } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { QuizController } from './quiz/quiz.controller';
import { winstonLogger } from './utils/winston.config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    logger: winstonLogger,
  });

  // config app
  setNestApp(app);

  //initialize Providers
  const quizController = app.get(QuizController);
  quizController.initialize();

  //Shutdown Hook is not supported to Window platform
  //ref : https://docs.nestjs.com/fundamentals/lifecycle-events#application-shutdown
  app.enableShutdownHooks();

  await app.listen(3000);
}
bootstrap();

export function setNestApp<T extends INestApplication>(app: T): void {
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
}
