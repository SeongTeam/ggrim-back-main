import { PickType } from '@nestjs/mapped-types';
import { Verification } from '../entity/verification.entity';

export class requestVerificationDTO extends PickType(Verification, ['email']) {}
