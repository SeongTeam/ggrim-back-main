import { PickType } from '@nestjs/mapped-types';
import { User } from '../entity/user.entity';

export class ReplacePassWordDTO extends PickType(User, ['password']) {}
