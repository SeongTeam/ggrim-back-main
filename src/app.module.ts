import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClsModule } from 'nestjs-cls';
import { DataSource } from 'typeorm';
import { LoggerModule } from './Logger/logger.module';
import { CommonModule } from './_common/common.module';
import { NODE_ENV } from './_common/const/env-keys.const';
import { RateLimitTestController } from './_common/rate-limit/rate-limit-test.controller';
import { RateLimitModule } from './_common/rate-limit/rate-limit.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ArtistModule } from './artist/artist.module';
import { AuthModule } from './auth/auth.module';
import { S3Module } from './aws/s3.module';
import { MailModule } from './mail/mail.module';
import { PaintingModule } from './painting/painting.module';
import { QuizModule } from './quiz/quiz.module';
import { SystemScheduleModule } from './schedule/schedule.module';
import { StyleModule } from './style/style.module';
import { TagModule } from './tag/tag.modue';
import { UserModule } from './user/user.module';
import { TypeORMConfig } from './utils/typeorm.config';

const ENV = process.env[NODE_ENV];

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: !ENV ? '.env' : `.env.${ENV}`,
      isGlobal: true,
      load: [
        () => {
          return {
            RATE_LIMIT_ENABLED: process.env.RATE_LIMIT_ENABLED || 'true',
            RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX || '100',
            RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS || '1000',
          };
        },
      ],
    }),
    TypeOrmModule.forRootAsync({
      useClass: TypeORMConfig,
      dataSourceFactory: async (options) => new DataSource(options!).initialize(),
    }),
    ClsModule.forRoot({
      global: true,
      interceptor: {
        mount: true,
      },
    }),
    ScheduleModule.forRoot(),
    LoggerModule,
    CommonModule,
    TagModule,
    StyleModule,
    PaintingModule,
    ArtistModule,
    QuizModule,
    S3Module,
    UserModule,
    AuthModule,
    MailModule,
    SystemScheduleModule,
    RateLimitModule,
  ],
  controllers: [AppController, RateLimitTestController],
  providers: [AppService],
})
export class AppModule {}
