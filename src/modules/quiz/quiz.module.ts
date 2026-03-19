import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ArtistModule } from "../artist/artist.module";
import { AuthModule } from "../auth/auth.module";
import { S3Module } from "../aws/s3.module";
import { PaintingModule } from "../painting/painting.module";
import { StyleModule } from "../style/style.module";
import { TagModule } from "../tag/tag.modue";
import { UserModule } from "../user/user.module";
import { QuizDislike } from "./entities/quizDislike.entity";
import { QuizLike } from "./entities/quizLike.entity";
import { Quiz } from "./entities/quiz.entity";
import { QuizScheduleService } from "./schedule/quizSchedule.service";
import { QuizController } from "./quiz.controller";
import { QuizService } from "./quiz.service";
import { QuizBatchService } from "./batch/quiz.batch.service";

@Module({
	imports: [
		TypeOrmModule.forFeature([Quiz, QuizLike, QuizDislike]),
		PaintingModule,
		S3Module,
		ArtistModule,
		TagModule,
		StyleModule,
		AuthModule,
		UserModule,
	],
	controllers: [QuizController],
	providers: [QuizService, QuizScheduleService, QuizBatchService],
	exports: [QuizService, QuizBatchService],
})
export class QuizModule {}
