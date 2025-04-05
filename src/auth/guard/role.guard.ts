import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../../user/decorator/role';
import { UserRole } from '../../user/entity/user.entity';
import { TokenAuthGuardResult } from './token-auth.guard';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const userInfo: TokenAuthGuardResult = req['TokenAuthGuardResult'];
    const requiredRoles = this.reflector.get<UserRole[]>(ROLES_KEY, context.getHandler());
    if (!requiredRoles) {
      return true;
    }

    const userRole = userInfo.decodedToken.role;
    return requiredRoles.some((role) => userRole === role);
  }
}
