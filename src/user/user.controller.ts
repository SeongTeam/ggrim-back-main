import { Crud, CrudController } from '@dataui/crud';
import { Controller } from '@nestjs/common';
import { CreateUserDTO } from './dto/create-user.dto';
import { User } from './entity/user.entity';
import { UserService } from './user.service';

@Crud({
  model: {
    type: User,
  },
  routes: {
    only: ['getOneBase', 'createOneBase', 'deleteOneBase', 'recoverOneBase'],
  },
  validation: { transform: true },
  params: {
    id: {
      field: 'id',
      type: 'uuid',
      primary: true,
    },
  },
  query: {
    allow: ['email', 'username', 'oauth_provider_id'],
    softDelete: true,
  },
  dto: {
    create: CreateUserDTO,
  },
})
@Controller('user')
export class UserController implements CrudController<User> {
  constructor(public service: UserService) {}
}
