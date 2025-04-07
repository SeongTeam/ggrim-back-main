import { IsDate, IsEmail, IsString, IsUUID } from 'class-validator';
import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { CustomBaseEntity } from '../../db/entity/custom.base.entity';

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
