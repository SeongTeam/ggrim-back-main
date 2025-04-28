import { IsEmail } from 'class-validator';

export class requestVerificationDTO {
  @IsEmail()
  email!: string;
}
