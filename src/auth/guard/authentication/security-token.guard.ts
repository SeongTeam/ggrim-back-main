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
import { OneTimeTokenPurpose } from '../../entity/one-time-token.entity';
import {
  AccessTokenPayload,
  AuthUserPayload,
  ENUM_AUTH_CONTEXT_KEY,
  SecurityTokenPayload,
} from '../type/request-payload';

const ENUM_ONE_TIME_TOKEN_HEADER = {
  X_ONE_TIME_TOKEN_ID: `x-one-time-token-identifier`,
  X_ONE_TIME_TOKEN: 'x-one-time-token-value',
};

//Guard does't Update OneTimeToken Table.
//It just validate OneTimeToken data from client

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

    const oneTimeToken = req.headers[ENUM_ONE_TIME_TOKEN_HEADER.X_ONE_TIME_TOKEN];
    const oneTimeTokenID = req.headers[ENUM_ONE_TIME_TOKEN_HEADER.X_ONE_TIME_TOKEN_ID];
    const handlerPurpose = this.reflector.get<OneTimeTokenPurpose>(
      PURPOSE_ONE_TIME_TOKEN_KEY,
      context.getHandler(),
    );

    if (isEmpty(oneTimeToken)) {
      throw new UnauthorizedException(`Missing or invalid security token header`);
    }

    const decoded: JWTDecode = await this.authService.verifyToken(oneTimeToken);
    const { email, purpose, type } = decoded;

    const user = await this.userService.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException(`${email} user is not existed`);
    }

    if (type !== 'ONE_TIME') {
      return true;
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
    if (!(oneTimeTokenID && isUUID(oneTimeTokenID))) {
      throw new UnauthorizedException(
        `Missing or invalid ${ENUM_ONE_TIME_TOKEN_HEADER.X_ONE_TIME_TOKEN_ID} header field`,
      );
    }

    const entity = await this.authService.findOneTimeToken({ where: { id: oneTimeTokenID } });
    if (!entity) {
      throw new UnauthorizedException(`invalid token ID. ${oneTimeTokenID}`);
    }

    const isHashMatched = await this.authService.isHashMatched(oneTimeToken, entity.token);

    if (!isHashMatched) {
      throw new UnauthorizedException(`invalid oneTimeToken. it is not matched. ${oneTimeToken}`);
    }
    if (entity.used_date) {
      throw new UnauthorizedException(
        `invalid oneTimeToken. it is already used. ${entity.used_date}`,
      );
    }

    const result: SecurityTokenPayload = {
      oneTimeToken,
      oneTimeTokenID,
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
}
