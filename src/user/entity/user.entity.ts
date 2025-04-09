import { IsEmail, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { OneTimeToken } from '../../auth/entity/one-time-token.entity';
import { CustomBaseEntity } from '../../db/entity/custom.base.entity';
import { IsInArray } from '../../utils/class-validator';

export type UserRole = 'admin' | 'user';

export type UserState = 'active' | 'inactive' | 'banned';

@Entity()
@Unique(['email', 'username'])
export class User extends CustomBaseEntity {
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id!: string;

  @Column()
  @IsEmail()
  email!: string;

  @Column()
  @IsString()
  @MinLength(8) // utf-8 형식에서 bcrypt는 문자열 크기 18까지만 가능. 2는 마진적용
  @MaxLength(16)
  password!: string;

  @Column({ default: 'user' })
  @IsInArray(['admin', 'user'])
  role!: UserRole;

  @Column()
  @IsString()
  @MinLength(4)
  @MaxLength(12)
  username!: string;

  @Column({ default: 'active' })
  active!: UserState;

  @Column({ type: 'timestamp with time zone', precision: 6, default: () => 'CURRENT_TIMESTAMP(6)' })
  last_login_date!: Date;

  /*TODO
    - Auth 로직추가시 해당 컬럼 관련 로직 개선하기
  */
  @IsOptional()
  @Column({ nullable: true })
  oauth_provider!: string;

  @IsOptional()
  @Column({ nullable: true })
  oauth_provider_id!: string;

  @OneToMany(() => OneTimeToken, (oneTimeToken) => oneTimeToken.user)
  oneTimeTokens!: OneTimeToken[];
}
