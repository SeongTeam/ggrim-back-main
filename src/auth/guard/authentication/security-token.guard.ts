import {
  CanActivate,
  ExecutionContext,
  forwardRef,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { isEmpty, isUUID } from 'class-validator';
import { ServiceException } from '../../../_common/filter/exception/service/service-exception';
import { UserService } from '../../../user/user.service';
import { AuthService, JWTDecode } from '../../auth.service';
import { PURPOSE_ONE_TIME_TOKEN_KEY } from '../../decorator/purpose-one-time-token';
import {
  SECURITY_TOKEN_GUARD_OPTIONS,
  SecurityTokenGuardOptions,
} from '../../decorator/security-token.guard.options';
import { OneTimeTokenPurpose } from '../../entity/one-time-token.entity';
import {
  AccessTokenPayload,
  AuthUserPayload,
  ENUM_AUTH_CONTEXT_KEY,
  SecurityTokenPayload,
} from '../type/request-payload';

const ENUM_SECURITY_TOKEN_HEADER = {
  X_SECURITY_TOKEN_ID: `x-security-token-identifier`,
  X_SECURITY_TOKEN: 'x-security-token-value',
};

//Guard does't Update OneTimeToken Table.
//It just validate OneTimeToken for Security data from client

@Injectable()
export class SecurityTokenGuard implements CanActivate {
  constructor(
    @Inject(AuthService) private readonly authService: AuthService,
    @Inject(forwardRef(() => UserService)) private readonly userService: UserService,
    private readonly reflector: Reflector, //
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const header = req.headers;

    const securityToken = req.headers[ENUM_SECURITY_TOKEN_HEADER.X_SECURITY_TOKEN];
    const securityTokenID = req.headers[ENUM_SECURITY_TOKEN_HEADER.X_SECURITY_TOKEN_ID];
    const handlerPurpose = this.reflector.get<OneTimeTokenPurpose>(
      PURPOSE_ONE_TIME_TOKEN_KEY,
      context.getHandler(),
    );
    const rawOptions: SecurityTokenGuardOptions | undefined =
      this.reflector.get<SecurityTokenGuardOptions>(
        SECURITY_TOKEN_GUARD_OPTIONS,
        context.getHandler(),
      );
    const options = this.normalizeOptions(rawOptions);
    const { withDeleted } = options;

    if (isEmpty(securityToken)) {
      throw new UnauthorizedException(`Missing or invalid security token header`);
    }

    const decoded: JWTDecode = await this.authService.verifyToken(securityToken);
    const { email, purpose, type } = decoded;

    const user = await this.userService.findOne({ where: { email }, withDeleted });
    if (!user) {
      throw new UnauthorizedException(`${email} user is not existed`);
    }

    if (type !== 'ONE_TIME') {
      throw new UnauthorizedException(`Can't access Without one-time-token`);
    }

    if (isEmpty(handlerPurpose)) {
      throw new ServiceException(
        'SERVICE_RUN_ERROR',
        'INTERNAL_SERVER_ERROR',
        `@PurposeOneTimeToken()  should be exist `,
      );
    }

    if (handlerPurpose !== purpose) {
      throw new UnauthorizedException(`purpose is not proper to handler`);
    }

    // check whether token is forged or not .
    if (!(securityTokenID && isUUID(securityTokenID))) {
      throw new UnauthorizedException(
        `Missing or invalid ${ENUM_SECURITY_TOKEN_HEADER.X_SECURITY_TOKEN_ID} header field`,
      );
    }

    const entity = await this.authService.findOneTimeToken({ where: { id: securityTokenID } });
    if (!entity) {
      throw new UnauthorizedException(`invalid token ID. ${securityTokenID}`);
    }

    const isHashMatched = await this.authService.isHashMatched(securityToken, entity.token);

    if (!isHashMatched) {
      throw new UnauthorizedException(`invalid securityToken. it is not matched. ${securityToken}`);
    }
    if (entity.used_date) {
      throw new UnauthorizedException(
        `invalid securityToken. it is already used. ${entity.used_date}`,
      );
    }

    const result: SecurityTokenPayload = {
      oneTimeToken: securityToken,
      oneTimeTokenID: securityTokenID,
    };
    req[ENUM_AUTH_CONTEXT_KEY.SECURITY_TOKEN] = result;

    const tokenResult: AccessTokenPayload = {
      userId: user.id,
      decodedToken: decoded,
    };
    req[ENUM_AUTH_CONTEXT_KEY.ACCESS_TOKEN] = tokenResult;

    const userResult: AuthUserPayload = {
      email: user.email,
      username: user.username,
      role: user.role,
      id: user.id,
    };
    req[ENUM_AUTH_CONTEXT_KEY.USER] = userResult;

    return true;
  }

  normalizeOptions(options?: SecurityTokenGuardOptions): SecurityTokenGuardOptions {
    const defaultOptions: SecurityTokenGuardOptions = { withDeleted: false };
    if (options === undefined || options === null) {
      return defaultOptions;
    }

    const keys = Object.keys(defaultOptions) as (keyof SecurityTokenGuardOptions)[];

    keys.forEach((key) => {
      if (isEmpty(options[key])) {
        options[key] = defaultOptions[key];
      }
    });

    return options;
  }
}
