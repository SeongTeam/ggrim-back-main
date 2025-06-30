import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ServiceException } from "../../../_common/filter/exception/service/serviceException";
import { ROLES_KEY } from "../../../user/decorator/role";
import { UserRole } from "../../../user/entity/user.entity";
import { AuthUserPayload, ENUM_AUTH_CONTEXT_KEY } from "../type/requestPayload";

@Injectable()
export class RolesGuard implements CanActivate {
	constructor(private reflector: Reflector) {}

	canActivate(context: ExecutionContext): boolean {
		const req = context.switchToHttp().getRequest();
		const userInfo: AuthUserPayload = req[ENUM_AUTH_CONTEXT_KEY.USER];
		const { user } = userInfo;

		if (!userInfo) {
			throw new ServiceException(
				"SERVICE_RUN_ERROR",
				"INTERNAL_SERVER_ERROR",
				`${ENUM_AUTH_CONTEXT_KEY.USER} field should exist`,
			);
		}

		const requiredRoles = this.reflector.get<UserRole[]>(ROLES_KEY, context.getHandler());
		if (!requiredRoles) {
			throw new ServiceException(
				"SERVICE_RUN_ERROR",
				"INTERNAL_SERVER_ERROR",
				`RoleGuard should need requiredRoles`,
			);
		}

		const userRole = user.role;
		return requiredRoles.some((role) => userRole === role);
	}
}
