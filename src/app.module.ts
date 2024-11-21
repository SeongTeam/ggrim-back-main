import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClsModule } from 'nestjs-cls';
import { DataSource } from 'typeorm';
import { LoggerModule } from './Logger/logger.module';
import { CommonModule } from './_common/common.module';
import { NODE_ENV } from './_common/const/env-keys.const';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ArtistModule } from './artist/artist.module';
import { PaintingModule } from './painting/painting.module';
import { QuizModule } from './quiz/quiz.module';
import { TypeormConfig } from './utils/typeorm.config';

const ENV = process.env[NODE_ENV];

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: !ENV ? '.env' : `.env.${ENV}`,
    }),
    TypeOrmModule.forRootAsync({
      useClass: TypeormConfig,
      dataSourceFactory: async (options) => new DataSource(options!).initialize(),
    }),
    ClsModule.forRoot({
      global: true,
      interceptor: {
        mount: true,
      },
    }),
    LoggerModule,
    CommonModule,
    PaintingModule,
    ArtistModule,
    QuizModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
