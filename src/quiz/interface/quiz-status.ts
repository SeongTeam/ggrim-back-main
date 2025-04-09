import { QuizContext } from './quiz-context';

export interface QuizStatus {
  context: QuizContext;
  currentIndex: number;
  endIndex: number;
}
