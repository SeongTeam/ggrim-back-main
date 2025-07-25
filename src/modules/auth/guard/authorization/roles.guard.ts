import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ServiceException } from "../../../_common/filter/exception/service/serviceException";
import { ROLES_KEY } from "../../../user/metadata/role";
import { UserRole } from "../../../user/entity/user.entity";
import { AUTH_GUARD_PAYLOAD } from "../const";
import { Request } from "express";

@Injectable()
export class RolesGuard implements CanActivate {
	constructor(private reflector: Reflector) {}

	canActivate(context: ExecutionContext): boolean {
		const req = context.switchToHttp().getRequest<Request>();
		const userInfo = req[AUTH_GUARD_PAYLOAD.USER];

		if (!userInfo) {
			throw new ServiceException(
				"SERVICE_RUN_ERROR",
				"INTERNAL_SERVER_ERROR",
				`${AUTH_GUARD_PAYLOAD.USER} field should exist`,
			);
		}
		const { user } = userInfo;

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
