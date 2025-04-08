import { IsBoolean, IsDate, IsEmail, IsJWT, IsUUID } from 'class-validator';
import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class PasswordResetToken extends BaseEntity {
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
