import { IsInArray } from '../../utils/class-validator';
import { OneTimeTokenPurpose, OneTimeTokenPurposeValues } from '../entity/one-time-token.entity';

export class CreateOneTimeTokenDTO {
  @IsInArray(Object.values(OneTimeTokenPurposeValues))
  purpose!: OneTimeTokenPurpose;
}
