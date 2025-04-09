import { IsBoolean, IsDate, IsEmail, IsJWT, IsUUID } from 'class-validator';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { CustomBaseEntity } from '../../db/entity/custom.base.entity';

@Entity()
export class PasswordResetToken extends CustomBaseEntity {
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id!: string;

  @Column()
  @IsEmail()
  email!: string;

  @Column()
  @IsJWT()
  token!: string;

  @Column({ default: false })
  @IsBoolean()
  is_used!: boolean;

  @Column()
  @IsDate()
  expired_date!: Date;
}
