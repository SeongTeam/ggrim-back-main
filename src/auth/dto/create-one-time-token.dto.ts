import { PickType } from '@nestjs/mapped-types';
import { OneTimeToken } from '../entity/one-time-token.entity';

export class CreateOneTimeTokenDTO extends PickType(OneTimeToken, ['email', 'purpose']) {}
