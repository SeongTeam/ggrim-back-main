import { PickType } from '@nestjs/mapped-types';
import { IsString } from 'class-validator';
import { requestVerificationDTO } from './request-verification.dto';

export class VerifyDTO extends PickType(requestVerificationDTO, ['email']) {
  @IsString()
  pinCode!: string;
}
