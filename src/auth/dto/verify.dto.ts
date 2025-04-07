import { IsString } from 'class-validator';

export class VerifyDTO {
  @IsString()
  pinCode!: string;
}
