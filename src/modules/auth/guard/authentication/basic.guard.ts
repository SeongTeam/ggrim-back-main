import {
	CanActivate,
	ExecutionContext,
	forwardRef,
	Inject,
	Injectable,
	UnauthorizedException,
} from "@nestjs/common";
import { plainToClass } from "class-transformer";
import { UserService } from "../../../user/user.service";
import { AuthService } from "../../auth.service";
import { BasicTokenGuardDTO } from "../dto/basicAuthGuard.dto";
import { AuthUserPayload } from "../types/requestPayload";
import { AUTH_GUARD_PAYLOAD } from "../const";
import { Request } from "express";

@Injectable()
export class BasicGuard implements CanActivate {
	constructor(
		@Inject(forwardRef(() => UserService)) private readonly userService: UserService,
		@Inject(AuthService) private readonly authService: AuthService,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const req = context.switchToHttp().getRequest<Request>();

		const header = req.headers["authorization"];

		if (!header) {
			throw new UnauthorizedException(`Not Exist authorization field.`);
		}
		if (!header || !header.startsWith("Basic ")) {
			throw new UnauthorizedException("Missing or invalid Authorization header");
		}

		const encodedInfo = this.authService.extractAuthorizationField(header, "Basic");

		const { email, password } = this.decodeBasicToken(encodedInfo);

		// TODO: Guard 로직 개선
		// - [x] validation 로직 추가
		//  -> <할 일 > 설명 ( 생략가능 )
		// - [ ] <추가 작업>
		// ! 주의: <경고할 사항>
		// ? 질문: <의문점 또는 개선 방향>
		// * 참고: <관련 정보나 링크>
		const user = await this.userService.findOne({ where: { email } });

		if (!user) {
			throw new UnauthorizedException("Not exist email");
		}

		const isAuthenticated = await this.authService.isHashMatched(password, user.password);
		if (!isAuthenticated) {
			throw new UnauthorizedException(`Check your email or password`);
		}

		const result: AuthUserPayload = {
			user,
		};
		req[AUTH_GUARD_PAYLOAD.USER] = result;

		return true;
	}

	decodeBasicToken(base64String: string): BasicTokenGuardDTO {
		const decoded = Buffer.from(base64String, "base64").toString("utf8");

		const split = decoded.split(":");

		if (split.length !== 2) {
			throw new UnauthorizedException("Invalid User Info", JSON.stringify(split, null, 2));
		}

		const email = split[0];
		const password = split[1];

		const dto: BasicTokenGuardDTO = plainToClass(BasicTokenGuardDTO, { email, password });

		return dto;
	}
}
