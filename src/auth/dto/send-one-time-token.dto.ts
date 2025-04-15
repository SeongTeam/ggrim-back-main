import { PickType } from '@nestjs/mapped-types';
import { IsInArray } from '../../utils/class-validator';
import {
  OneTimeToken,
  OneTimeTokenPurpose,
  OneTimeTokenPurposeValues,
} from '../entity/one-time-token.entity';

export class SendOneTimeTokenDTO extends PickType(OneTimeToken, ['email']) {
  @IsInArray([OneTimeTokenPurposeValues.UPDATE_PASSWORD, OneTimeTokenPurposeValues.RECOVER_ACCOUNT])
  purpose!: OneTimeTokenPurpose;
}
