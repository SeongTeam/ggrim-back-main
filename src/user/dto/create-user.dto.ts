import { PickType } from '@nestjs/mapped-types';
import { User } from '../entity/user.entity';

export class CreateUserDTO extends PickType(User, [
  'email',
  'password',
  'username',
  'oauth_provider',
  'oauth_provider_id',
]) {}
