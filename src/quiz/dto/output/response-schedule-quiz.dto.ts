import { randomInt } from 'node:crypto';
import { Quiz } from '../../entities/quiz.entity';
import { QuizContext } from '../../interface/quiz-context';
import { QuizStatus } from '../../interface/quiz-status';

export class ResponseQuizDTO {
  quiz!: Quiz;
  status!: QuizStatus;

  constructor(quizList: Quiz[], context: QuizContext, currentIndex?: number) {
    const INIT_INDEX = -1;
    this.status = { currentIndex: INIT_INDEX, endIndex: INIT_INDEX, context };
    this.status.currentIndex = currentIndex
      ? (currentIndex + 1) % quizList.length
      : randomInt(quizList.length);

    this.status.endIndex = quizList.length - 1;
    this.quiz = quizList[this.status.currentIndex];
  }
}
