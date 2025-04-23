import { IsString } from 'class-validator';
import { IsInArray } from '../../utils/class-validator';

export const QuizReactionTypeValues = {
  LIKE: 'like',
  DISLIKE: 'dislike',
} as const;

export type QuizReactionType = (typeof QuizReactionTypeValues)[keyof typeof QuizReactionTypeValues];
export class ReactToQuizDTO {
  @IsString()
  @IsInArray(Object.values(QuizReactionTypeValues))
  type!: QuizReactionType;
}
