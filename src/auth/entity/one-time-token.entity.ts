import { IsDate, IsEmail, IsJWT, IsUUID } from 'class-validator';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { CustomBaseEntity } from '../../db/entity/custom.base.entity';
import { User } from '../../user/entity/user.entity';
import { IsInArray } from '../../utils/class-validator';

export const OneTimeTokenPurposeValues = {
  UPDATE_PASSWORD: 'update-password',
  DELETE_ACCOUNT: 'delete-account',
  MAGIC_LOGIN: 'magic-login',
  EMAIL_VERIFICATION: 'email-verification',
  // SET_USER_ACTIVE : 'set-user-active',
  // RESET_PASSWORD: 'reset-password',
} as const;

export type OneTimeTokenPurpose =
  (typeof OneTimeTokenPurposeValues)[keyof typeof OneTimeTokenPurposeValues];
@Entity()
export class OneTimeToken extends CustomBaseEntity {
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id!: string;

  @Column()
  @IsEmail()
  email!: string;

  @Column()
  @IsJWT()
  token!: string;

  @Column({ nullable: true })
  @IsDate()
  used_date!: Date;

  @Column()
  @IsDate()
  expired_date!: Date;

  // 외래 키 컬럼 명시적으로 정의
  @Column()
  @IsUUID()
  user_id!: string;

  @ManyToOne(() => User, (user) => user.oneTimeTokens)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column()
  @IsInArray(Object.values(OneTimeTokenPurposeValues))
  purpose!: OneTimeTokenPurpose;
}
