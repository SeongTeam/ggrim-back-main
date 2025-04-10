import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ServiceException } from '../../../_common/filter/exception/service/service-exception';
import { ROLES_KEY } from '../../../user/decorator/role';
import { UserRole } from '../../../user/entity/user.entity';
import { AuthUserPayload, ENUM_AUTH_CONTEXT_KEY } from '../type/request-payload';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const userInfo: AuthUserPayload = req[ENUM_AUTH_CONTEXT_KEY.USER];

    if (!userInfo) {
      throw new ServiceException(
        'SERVICE_RUN_ERROR',
        'INTERNAL_SERVER_ERROR',
        `${ENUM_AUTH_CONTEXT_KEY.USER} field should exist`,
      );
    }

    const requiredRoles = this.reflector.get<UserRole[]>(ROLES_KEY, context.getHandler());
    if (!requiredRoles) {
      return true;
    }

    const userRole = userInfo.role;
    return requiredRoles.some((role) => userRole === role);
  }
}
