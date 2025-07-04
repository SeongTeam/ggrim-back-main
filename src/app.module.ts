import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ClsModule } from "nestjs-cls";
import { DataSource } from "typeorm";
import { LoggerModule } from "./modules/logger/logger.module";
import { CommonModule } from "./modules/_common/common.module";
import { NODE_ENV } from "./modules/_common/const/envKeys";
import { RateLimitTestController } from "./modules/_common/rate-limit/rateLimitTest.controller";
import { RateLimitModule } from "./modules/_common/rate-limit/rateLimit.module";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ArtistModule } from "./modules/artist/artist.module";
import { AuthModule } from "./modules/auth/auth.module";
import { S3Module } from "./modules/aws/s3.module";
import { MailModule } from "./modules/mail/mail.module";
import { PaintingModule } from "./modules/painting/painting.module";
import { QuizModule } from "./modules/quiz/quiz.module";
import { SystemScheduleModule } from "./modules/schedule/schedule.module";
import { StyleModule } from "./modules/style/style.module";
import { TagModule } from "./modules/tag/tag.modue";
import { UserModule } from "./modules/user/user.module";
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
