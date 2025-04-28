import { PickType } from '@nestjs/mapped-types';
import { CreateUserDTO } from '../../../user/dto/create-user.dto';

export class BasicTokenGuardDTO extends PickType(CreateUserDTO, ['email', 'password']) {}
