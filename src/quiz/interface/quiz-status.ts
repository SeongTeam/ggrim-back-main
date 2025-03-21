import { QuizContext } from './quiz-context';

export interface QuizStatus {
  context: QuizContext;
  currentIdx: number;
  endIdx: number;
}
