import { PickType } from '@nestjs/mapped-types';
import { User } from '../../../user/entity/user.entity';

export class BasicTokenGuardDTO extends PickType(User, ['email', 'password']) {}
