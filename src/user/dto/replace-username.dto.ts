import { PickType } from '@nestjs/mapped-types';
import { User } from '../entity/user.entity';

export class ReplaceUsernameDTO extends PickType(User, ['username']) {}
