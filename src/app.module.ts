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
import { S3Module } from './aws/s3.module';
import { PaintingModule } from './painting/painting.module';
import { QuizModule } from './quiz/quiz.module';
import { StyleModule } from './style/style.module';
import { TagModule } from './tag/tag.modue';
import { TypeORMConfig } from './utils/typeorm.config';
import { UserModule } from './user/user.module';

const ENV = process.env[NODE_ENV];

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: !ENV ? '.env' : `.env.${ENV}`,
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
    LoggerModule,
    CommonModule,
    TagModule,
    StyleModule,
    PaintingModule,
    ArtistModule,
    QuizModule,
    S3Module,
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
