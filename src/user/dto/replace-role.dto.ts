import { PickType } from '@nestjs/mapped-types';
import { CreateUserDTO } from './create-user.dto';

export class ReplaceRoleDTO extends PickType(CreateUserDTO, ['role']) {}
