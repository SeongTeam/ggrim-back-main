import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { S3Module } from '../aws/s3.module';
import { PaintingModule } from '../painting/painting.module';
import { Quiz } from './entities/quiz.entity';
import { QuizScheduleService } from './quiz-schedule.service';
import { QuizController } from './quiz.controller';
import { QuizService } from './quiz.service';

@Module({
  imports: [TypeOrmModule.forFeature([Quiz]), PaintingModule, S3Module],
  controllers: [QuizController],
  providers: [QuizService, QuizScheduleService],
})
export class QuizModule {}
