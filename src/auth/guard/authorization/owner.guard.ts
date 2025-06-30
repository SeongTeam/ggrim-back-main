import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { ModuleRef, Reflector } from "@nestjs/core";
import { ServiceException } from "../../../_common/filter/exception/service/serviceException";
import { ADMIN_ACCESS_KEY } from "../../metadata/adminAccess";
import { CHECK_OWNER_KEY, CheckOwnerOption } from "../../metadata/owner";
import { AUTH_GUARD_PAYLOAD } from "../type/requestPayload";
import { AuthGuardRequest } from "../type/AuthRequest";

// TODO: OwnerGuard 기능 개선
// - [x] User Role = admin 일때, 통과시키기
// - [ ] <추가 작업>
// ! 주의: <경고할 사항>
// ? 질문: Reflector의 getAllAndOverride() 와 get()의 차이는 무엇인가?
// * 참고: <관련 정보나 링크>
@Injectable()
export class OwnerGuard implements CanActivate {
	constructor(
		private readonly reflector: Reflector,
		private readonly moduleRef: ModuleRef,
	) {}
	async canActivate(context: ExecutionContext): Promise<boolean> {
		const options = this.reflector.get<CheckOwnerOption>(CHECK_OWNER_KEY, context.getHandler());

		const isAdminAccess = this.reflector.get<boolean>(ADMIN_ACCESS_KEY, context.getHandler());
		const request = context.switchToHttp().getRequest<AuthGuardRequest>();
		const userPayload = request[AUTH_GUARD_PAYLOAD.USER];

		if (!userPayload) {
			throw new ServiceException(
				"SERVICE_RUN_ERROR",
				"INTERNAL_SERVER_ERROR",
				`${AUTH_GUARD_PAYLOAD.USER} field should exist`,
			);
		}
		const { user } = userPayload;

		if (isAdminAccess && user.role === "admin") {
			return true;
		}

		if (!options) {
			throw new ServiceException(
				"SERVICE_RUN_ERROR",
				"INTERNAL_SERVER_ERROR",
				`OwnerGuard needs CheckOwnerOption Metadata`,
			);
		}

		const { serviceClass, idParam, ownerField, serviceMethod } = options;

		const resourceId = request.params[idParam];
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const serviceInstance = this.moduleRef.get(serviceClass, { strict: false });

		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		if (!serviceInstance || typeof serviceInstance[serviceMethod] !== "function") {
			throw new ServiceException(
				`SERVICE_RUN_ERROR`,
				`INTERNAL_SERVER_ERROR`,
				`Service must have a '${serviceMethod}' method to retrieve the resource.`,
			);
		}

		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
		const resource = await serviceInstance[serviceMethod](resourceId);
		if (!resource) {
			throw new ServiceException(
				`ENTITY_NOT_FOUND`,
				`FORBIDDEN`,
				`can't find resource ${resourceId}`,
			);
		}

		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		if (resource[ownerField] !== user.id) {
			throw new ServiceException(
				`ENTITY_NOT_FOUND`,
				`FORBIDDEN`,
				`can't access resource without ownership`,
			);
		}

		return true;
	}
}
