import { IsEmail, IsOptional, IsUUID } from 'class-validator';
import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { CustomBaseEntity } from '../../db/entity/custom.base.entity';

type UserRole = 'admin' | 'user';

type UserState = 'active' | 'inactive' | 'banned';

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
  password!: string;

  @Column({ default: 'user' })
  role!: UserRole;

  @Column()
  username!: string;

  @Column({ default: 'active' })
  active!: UserState;

  @Column({ type: 'timestamp with time zone', precision: 6, default: () => 'CURRENT_TIMESTAMP(6)' })
  last_login_at!: Date;

  /*TODO
    - Auth 로직추가시 해당 컬럼 관련 로직 개선하기
  */
  @IsOptional()
  @Column({ nullable: true })
  oauth_provider!: string;

  @IsOptional()
  @Column({ nullable: true })
  oauth_provider_id!: string;
}
