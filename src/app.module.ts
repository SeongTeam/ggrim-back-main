import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ClsModule } from "nestjs-cls";
import { DataSource } from "typeorm";
import { LoggerModule } from "./Logger/logger.module";
import { CommonModule } from "./_common/common.module";
import { NODE_ENV } from "./_common/const/envKeys.const";
import { RateLimitTestController } from "./_common/rate-limit/rateLimitTest.controller";
import { RateLimitModule } from "./_common/rate-limit/rateLimit.module";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ArtistModule } from "./artist/artist.module";
import { AuthModule } from "./auth/auth.module";
import { S3Module } from "./aws/s3.module";
import { MailModule } from "./mail/mail.module";
import { PaintingModule } from "./painting/painting.module";
import { QuizModule } from "./quiz/quiz.module";
import { SystemScheduleModule } from "./schedule/schedule.module";
import { StyleModule } from "./style/style.module";
import { TagModule } from "./tag/tag.modue";
import { UserModule } from "./user/user.module";
import { TypeORMConfig } from "./utils/typeormConfig";

const ENV = process.env[NODE_ENV];

@Module({
	imports: [
		ConfigModule.forRoot({
			envFilePath: !ENV ? ".env" : `.env.${ENV}`,
			isGlobal: true,
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
