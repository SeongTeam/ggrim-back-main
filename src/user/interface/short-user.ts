import { User, UserRole, UserState } from '../../user/entity/user.entity';

export class ShortUser implements Pick<User, 'username' | 'active' | 'id' | 'role'> {
  constructor(user: User) {
    this.username = user.username;
    this.active = user.active;
    this.id = user.id;
    this.role = user.role;
  }
  username: string;
  active: UserState;
  id: string;
  role: UserRole;
}
