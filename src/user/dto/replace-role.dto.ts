import { PickType } from '@nestjs/mapped-types';
import { User } from '../entity/user.entity';

export class ReplaceRoleDTO extends PickType(User, ['role']) {}
