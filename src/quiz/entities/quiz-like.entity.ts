import { IsUUID } from 'class-validator';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { CustomBaseEntity } from '../../db/entity/custom.base.entity';
import { User } from '../../user/entity/user.entity';
import { Quiz } from './quiz.entity';

@Entity()
@Unique(['user', 'quiz'])
export class QuizLike extends CustomBaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column()
  @IsUUID()
  user_id!: string;

  @ManyToOne(() => Quiz)
  @JoinColumn({ name: 'quiz_id' })
  quiz!: Quiz;

  @Column()
  @IsUUID()
  quiz_id!: string;
}
