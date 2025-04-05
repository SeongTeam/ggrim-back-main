import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ModuleRef, Reflector } from '@nestjs/core';
import { ServiceException } from '../../_common/filter/exception/service/service-exception';
import { CHECK_OWNER_KEY, CheckOwnerOption } from '../decorator/owner';
import { TokenAuthGuard, TokenAuthGuardResult } from './token-auth.guard';

// TODO: OwnerGuard 기능 개선
// - [ ] User Role = admin 일때, 통과시키기
// - [ ] <추가 작업>
// ! 주의: <경고할 사항>
// ? 질문: Reflector의 getAllAndOverride() 와 get()의 차이는 무엇인가?
// * 참고: <관련 정보나 링크>
@Injectable()
export class OwnerGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly moduleRef: ModuleRef,
    private readonly tokenAuthGuard: TokenAuthGuard,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // default authenticate jwt
    await this.tokenAuthGuard.canActivate(context);
    const options = this.reflector.get<CheckOwnerOption>(CHECK_OWNER_KEY, context.getHandler());

    if (!options) return true;

    const { serviceClass, idParam, ownerField, serviceMethod } = options;

    const request = context.switchToHttp().getRequest();
    const userInfo: TokenAuthGuardResult = request['TokenAuthGuardResult'];
    const resourceId = request.params[idParam];

    const serviceInstance = this.moduleRef.get(serviceClass, { strict: false });

    if (!serviceInstance || typeof serviceInstance[serviceMethod] !== 'function') {
      throw new ServiceException(
        `SERVICE_RUN_ERROR`,
        `INTERNAL_SERVER_ERROR`,
        `Service must have a '${serviceMethod}' method to retrieve the resource.`,
      );
    }

    const resource = await serviceInstance[serviceMethod](resourceId);
    if (!resource) {
      throw new ServiceException(
        `ENTITY_NOT_FOUND`,
        `FORBIDDEN`,
        `can't find resource ${resourceId}`,
      );
    }

    if (resource[ownerField] !== userInfo.userId) {
      throw new ServiceException(
        `ENTITY_NOT_FOUND`,
        `FORBIDDEN`,
        `can't access resource without ownership`,
      );
    }

    return true;
  }
}
