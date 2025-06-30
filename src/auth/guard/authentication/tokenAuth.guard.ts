import {
	CanActivate,
	ExecutionContext,
	forwardRef,
	Inject,
	Injectable,
	UnauthorizedException,
} from "@nestjs/common";
import { UserService } from "../../../user/user.service";
import { AuthService, JWTDecode } from "../../auth.service";
import { AccessTokenPayload, AuthUserPayload, ENUM_AUTH_CONTEXT_KEY } from "../type/requestPayload";

const ENUM_HEADER_FIELD = {
	AUTHORIZATION: "authorization",
	X_REFRESH_TOKEN: "x-refresh-token",
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

		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			throw new UnauthorizedException("Missing or invalid Authorization Bearer header");
		}

		const token = this.authService.extractAuthorizationField(authHeader, "Bearer");

		const decoded: JWTDecode = await this.authService.verifyToken(token);
		const email = decoded.email;

		const user = await this.userService.findOne({ where: { email } });
		if (!user || user.active != "active") {
			throw new UnauthorizedException(`${email} user is deleted or not active`);
		}

		// TODO: Access Token 인증 로직 개선
		// - [ ] Access Token 만료시 개선할 방법 모색 및 구현
		//  -> 현재는 사용자가 없고, Access Token 만료 기간이 3H정도 이므로, 지금 당장은 불필요
		// - [ ] <추가 작업>
		// ! 주의: <경고할 사항>
		// ? 질문: <의문점 또는 개선 방향>
		// * 참고: <관련 정보나 링크>

		const result: AccessTokenPayload = {
			userId: user.id,
			decodedToken: decoded,
		};
		req[ENUM_AUTH_CONTEXT_KEY.ACCESS_TOKEN] = result;

		const userResult: AuthUserPayload = {
			user,
		};
		req[ENUM_AUTH_CONTEXT_KEY.USER] = userResult;

		return true;
	}
}
