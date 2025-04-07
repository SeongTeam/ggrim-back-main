import { IsEmail } from 'class-validator';

export class RegisterDTO {
  @IsEmail()
  email!: string;
}
