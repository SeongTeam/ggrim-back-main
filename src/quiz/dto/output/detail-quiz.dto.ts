import { Quiz } from '../../entities/quiz.entity';
import { QuizReactionCount } from '../../interface/reaction-count';
import { QuizReactionType } from '../quiz-reaction.dto';

export class DetailQuizDTO {
  quiz!: Quiz;
  reactionCount!: QuizReactionCount;
  userReaction?: QuizReactionType;
}
