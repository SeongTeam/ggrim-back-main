import { IsDate, IsEmail, IsString, IsUUID } from 'class-validator';
import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { CustomBaseEntity } from '../../db/entity/custom.base.entity';

// TODO 인증 로직 보안 강화
// [ ] : 시도 횟수 정보 저장하여 무차별 대입 예방하기
@Entity()
@Unique(['email'])
export class Verification extends CustomBaseEntity {
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id!: string;

  @Column()
  @IsEmail()
  email!: string;

  @Column({ default: false })
  is_verified!: boolean;

  @Column()
  @IsString()
  pin_code!: string;

  @Column({ type: 'timestamp with time zone', precision: 6 })
  @IsDate()
  pin_code_expired_date!: Date;
}
