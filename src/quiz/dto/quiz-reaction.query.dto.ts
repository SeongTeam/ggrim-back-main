import { PickType } from '@nestjs/mapped-types';
import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsUUID } from 'class-validator';
import { QuizReactionDTO } from './quiz-reaction.dto';

export class QuizReactionQueryDTO extends PickType(QuizReactionDTO, ['type']) {
  @IsOptional()
  @IsUUID()
  user_id?: string;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => (value !== undefined ? Number(value) : 0))
  page?: number;
}
