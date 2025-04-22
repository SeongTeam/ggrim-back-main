import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArtistModule } from '../artist/artist.module';
import { AuthModule } from '../auth/auth.module';
import { S3Module } from '../aws/s3.module';
import { LoggerModule } from '../Logger/logger.module';
import { PaintingModule } from '../painting/painting.module';
import { StyleModule } from '../style/style.module';
import { TagModule } from '../tag/tag.modue';
import { UserModule } from '../user/user.module';
import { Quiz } from './entities/quiz.entity';
import { QuizScheduleService } from './quiz-schedule.service';
import { QuizController } from './quiz.controller';
import { QuizService } from './quiz.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Quiz]),
    PaintingModule,
    S3Module,
    LoggerModule,
    ArtistModule,
    TagModule,
    StyleModule,
    AuthModule,
    UserModule,
  ],
  controllers: [QuizController],
  providers: [QuizService, QuizScheduleService],
})
export class QuizModule {}
