import { IsBoolean, IsNotEmpty } from 'class-validator';

export class QuizSubmitDTO {
  @IsBoolean()
  @IsNotEmpty()
  isCorrect!: boolean;
}
