import { Exclude } from 'class-transformer';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { OneTimeToken } from '../../auth/entity/one-time-token.entity';
import { CustomBaseEntity } from '../../db/entity/custom.base.entity';
import { Quiz } from '../../quiz/entities/quiz.entity';

export type UserRole = 'admin' | 'user';

export type UserState = 'active' | 'inactive' | 'banned';

@Entity()
@Unique(['email', 'username'])
export class User extends CustomBaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  email!: string;

  @Column()
  @Exclude()
  password!: string;

  @Column({ default: 'user' })
  role!: UserRole;

  @Column()
  username!: string;

  @Column({ default: 'active' })
  active!: UserState;

  @Column({ type: 'timestamp with time zone', precision: 6, default: () => 'CURRENT_TIMESTAMP(6)' })
  last_login_date!: Date;

  /*TODO
    - Oauth 로직추가시 해당 컬럼 관련 로직 개선하기
  */
  @Column({ nullable: true })
  oauth_provider!: string;

  @Column({ nullable: true })
  oauth_provider_id!: string;

  @OneToMany(() => OneTimeToken, (oneTimeToken) => oneTimeToken.user)
  oneTimeTokens!: OneTimeToken[];

  @OneToMany(() => Quiz, (quiz) => quiz.owner)
  quizzes!: Quiz[];
}
