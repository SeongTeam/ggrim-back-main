import { BadRequestException, CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { ModuleRef, Reflector } from "@nestjs/core";
import { ServiceException } from "../../../_common/filter/exception/service/serviceException";
import { ADMIN_ACCESS_KEY } from "../../metadata/adminAccess";
import { CHECK_OWNER_KEY, CheckOwnerOption } from "../../metadata/owner";
import { AUTH_GUARD_PAYLOAD } from "../const";
import { Request } from "express";
import { ObfuscateUtil } from "../../../../utils/obfuscate";

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
		const request = context.switchToHttp().getRequest<Request>();
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

		const { serviceClass } = options;

		const idParam = "id";
		const externalId = request.params[idParam];

		const resourceId = ObfuscateUtil.transformToId(externalId);

		if (!resourceId) {
			throw new BadRequestException(`id(${resourceId}) is invalid format. `);
		}

		const serviceInstance = this.moduleRef.get(serviceClass, { strict: false });

		if (!serviceInstance) {
			throw new ServiceException(
				`SERVICE_RUN_ERROR`,
				`INTERNAL_SERVER_ERROR`,
				`Service '${serviceClass.name}' must to be existed.`,
			);
		}

		const isOwner = await serviceInstance.isOwner(resourceId, user.id);

		if (!isOwner) {
			throw new ServiceException(
				`ENTITY_NOT_FOUND`,
				`FORBIDDEN`,
				`can't access resource without ownership`,
			);
		}

		return true;
	}
}
