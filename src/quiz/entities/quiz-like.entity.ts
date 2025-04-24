import { IsUUID } from 'class-validator';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { CustomBaseEntity } from '../../db/entity/custom.base.entity';
import { User } from '../../user/entity/user.entity';
import { Quiz } from './quiz.entity';

// TODO : 쿼리 성능 개선
// - [ ] : 조회성능 향상을 위해 user_id와 quiz_id에 대한 복합키 고려하기
@Entity()
@Unique(['user_id', 'quiz_id'])
export class QuizLike extends CustomBaseEntity {
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id!: string;

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
