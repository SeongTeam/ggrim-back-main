import { PickType } from '@nestjs/mapped-types';
import { IsString } from 'class-validator';
import { Verification } from '../entity/verification.entity';

export class VerifyDTO extends PickType(Verification, ['email']) {
  @IsString()
  pinCode!: string;
}
