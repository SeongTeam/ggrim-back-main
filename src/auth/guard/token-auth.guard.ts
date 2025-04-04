import {
  CanActivate,
  ExecutionContext,
  forwardRef,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from '../../user/user.service';
import { AuthService, JWTDecode } from '../auth.service';

export interface TokenAuthGuardResult {
  userId: string;
  decodedToken: JWTDecode;
}

const ENUM_HEADER_FIELD = {
  AUTHORIZATION: 'authorization',
  X_REFRESH_TOKEN: 'X-Refresh-Token',
};

@Injectable()
export class TokenAuthGuard implements CanActivate {
  constructor(
    @Inject(AuthService) private readonly authService: AuthService,
    @Inject(forwardRef(() => UserService)) private readonly userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    const authHeader = req.headers[ENUM_HEADER_FIELD.AUTHORIZATION];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization Bearer header');
    }

    const token = this.authService.extractAuthorizationField(authHeader, 'Bearer');

    const decoded: JWTDecode = await this.authService.verifyToken(token);
    const email = decoded.email;

    const user = await this.userService.findOne({ where: { email } });
    if (!user || user.active != 'active') {
      throw new UnauthorizedException(`${email} user is deleted or not active`);
    }

    // TODO: Token Guard 로직 추가
    // - [ ] Access Token 갱신 로직 추가
    //  -> <할 일 > 설명 ( 생략가능 )
    // - [ ] <추가 작업>
    // ! 주의: <경고할 사항>
    // ? 질문: <의문점 또는 개선 방향>
    // * 참고: <관련 정보나 링크>

    const result: TokenAuthGuardResult = {
      userId: user.id,
      decodedToken: decoded,
    };
    req['TokenAuthGuardResult'] = result;

    return true;
  }
}
