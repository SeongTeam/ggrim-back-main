import { IsDate, IsEmail, IsString, IsUUID } from 'class-validator';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { CustomBaseEntity } from '../../db/entity/custom.base.entity';

// TODO 인증 로직 보안 강화
// [ ] : 무차별 대입 예방 로직 구현(시도 횟수 정보 저장, IP 주소 Rate Liming, Captcha 적용 등)
//  => 현재는 만료 기간이 5분, 짧으므로 당장은 불필요.
@Entity()
export class Verification extends CustomBaseEntity {
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id!: string;

  @Column()
  @IsEmail()
  email!: string;

  @Column({ nullable: true })
  @IsDate()
  verification_success_date!: Date;

  @Column({ nullable: true })
  @IsDate()
  last_verified_date!: Date;

  @Column()
  @IsString()
  pin_code!: string;

  @Column({ type: 'timestamp with time zone', precision: 6 })
  @IsDate()
  pin_code_expired_date!: Date;
}
