import { Quiz } from '../../entities/quiz.entity';
import { QuizStatus } from '../../interface/quiz-status';

export interface ResponseQuizDTO {
  quiz: Quiz;
  status: QuizStatus;
}
