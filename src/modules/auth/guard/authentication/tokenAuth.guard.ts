import {
	CanActivate,
	ExecutionContext,
	forwardRef,
	Inject,
	Injectable,
	UnauthorizedException,
} from "@nestjs/common";
import { UserService } from "../../../user/user.service";
import { AuthService } from "../../auth.service";
import { AccessTokenPayload, AuthUserPayload } from "../types/requestPayload";
import { AUTH_GUARD_PAYLOAD } from "../const";
import { Request } from "express";
import { JWTDecode } from "../../types/jwt";

const HEADER_FIELD = {
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
		const req = context.switchToHttp().getRequest<Request>();

		const authHeader = req.headers[HEADER_FIELD.AUTHORIZATION] as string;

		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			throw new UnauthorizedException("Missing or invalid Authorization Bearer header");
		}

		const token = this.authService.extractAuthorizationField(authHeader, "Bearer");

		const decoded: JWTDecode = this.authService.verifyToken(token);
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
		req[AUTH_GUARD_PAYLOAD.ACCESS_TOKEN] = result;

		const userResult: AuthUserPayload = {
			user,
		};
		req[AUTH_GUARD_PAYLOAD.USER] = userResult;

		return true;
	}
}
