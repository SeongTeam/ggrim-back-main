import {
	CanActivate,
	ExecutionContext,
	forwardRef,
	Inject,
	Injectable,
	UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { isEmpty, isUUID } from "class-validator";
import { ServiceException } from "../../../_common/filter/exception/service/serviceException";
import { UserService } from "../../../user/user.service";
import { AuthService } from "../../auth.service";
import { PURPOSE_ONE_TIME_TOKEN_KEY } from "../../metadata/purposeOneTimeToken";
import {
	SECURITY_TOKEN_GUARD_OPTIONS,
	SecurityTokenGuardOptions,
} from "../../metadata/securityTokenGuardOption";
import { OneTimeTokenPurpose } from "../../entity/oneTimeToken.entity";
import { AccessTokenPayload, AuthUserPayload, SecurityTokenPayload } from "../types/requestPayload";
import { AUTH_GUARD_PAYLOAD, ONE_TIME_TOKEN_HEADER } from "../const";
import { Request } from "express";
import { JWTDecode } from "../../types/jwt";
import { User } from "../../../user/entity/user.entity";

//Guard does't Update OneTimeToken Table.
//It just validate OneTimeToken for Security data from client

// TODO :  SecurityTokenGuard 개선
// [ ] OneTimeToken 마킹 로직 추가하기
//  -> QueryRunner를 Middleware에서 생성하도록 수정하여, Guard에서도 QueryRunner 접근하도록 만들기
//     Transaction 커밋과 롤백은 그대로 Interceptor에서 진행하기
//     MiddleWare와 InterCeptor는 전역으로 설정하는게 편할듯 하다.

@Injectable()
export class SecurityTokenGuard implements CanActivate {
	constructor(
		@Inject(AuthService) private readonly authService: AuthService,
		@Inject(forwardRef(() => UserService)) private readonly userService: UserService,
		private readonly reflector: Reflector, //
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const { securityToken, securityTokenID, handlerPurpose, decoded, user } =
			await this.extractData(context);

		this.validate(decoded, handlerPurpose);
		await this.verify(securityToken, securityTokenID);

		const req = context.switchToHttp().getRequest<Request>();
		const result: SecurityTokenPayload = {
			oneTimeToken: securityToken,
			oneTimeTokenID: securityTokenID,
		};
		req[AUTH_GUARD_PAYLOAD.SECURITY_TOKEN] = result;

		const tokenResult: AccessTokenPayload = {
			userId: user.id,
			decodedToken: decoded,
		};
		req[AUTH_GUARD_PAYLOAD.ACCESS_TOKEN] = tokenResult;

		const userResult: AuthUserPayload = {
			user,
		};
		req[AUTH_GUARD_PAYLOAD.USER] = userResult;

		return true;
	}

	async extractData(context: ExecutionContext) {
		const req = context.switchToHttp().getRequest<Request>();
		const securityToken = req.headers[ONE_TIME_TOKEN_HEADER.X_ONE_TIME_TOKEN] as string;
		const securityTokenID = req.headers[ONE_TIME_TOKEN_HEADER.X_ONE_TIME_TOKEN_ID] as string;
		const handlerPurpose = this.reflector.get<OneTimeTokenPurpose>(
			PURPOSE_ONE_TIME_TOKEN_KEY,
			context.getHandler(),
		);

		if (isEmpty(securityToken)) {
			throw new UnauthorizedException(`Missing or invalid security token header`);
		}

		if (!(securityTokenID && isUUID(securityTokenID))) {
			throw new UnauthorizedException(
				`Missing or invalid ${ONE_TIME_TOKEN_HEADER.X_ONE_TIME_TOKEN_ID} header field`,
			);
		}

		if (isEmpty(handlerPurpose)) {
			throw new ServiceException(
				"SERVICE_RUN_ERROR",
				"INTERNAL_SERVER_ERROR",
				`@PurposeOneTimeToken()  should be exist `,
			);
		}

		const decoded = this.decode(securityToken);
		const user = await this.findOwner(decoded.email, this.getOption(context));

		return { securityToken, securityTokenID, handlerPurpose, decoded, user };
	}

	validate(decoded: JWTDecode, handlerPurpose: OneTimeTokenPurpose) {
		const { purpose, type } = decoded;

		if (type !== "ONE_TIME") {
			throw new UnauthorizedException(`Can't access Without one-time-token`);
		}

		if (handlerPurpose !== purpose) {
			throw new UnauthorizedException(`purpose is not proper to handler`);
		}
	}

	async verify(securityToken: string, securityTokenID: string) {
		const entity = await this.authService.findOneTimeToken({ where: { id: securityTokenID } });
		if (!entity) {
			throw new UnauthorizedException(`invalid token ID. ${securityTokenID}`);
		}

		const isHashMatched = await this.authService.isHashMatched(securityToken, entity.token);

		if (!isHashMatched) {
			throw new UnauthorizedException(
				`invalid securityToken. it is not matched. ${securityToken}`,
			);
		}
		if (entity.used_date) {
			throw new UnauthorizedException(
				`invalid securityToken. it is already used. ${entity.used_date.getDate()}`,
			);
		}
	}

	private getOption(context: ExecutionContext): SecurityTokenGuardOptions {
		const options: SecurityTokenGuardOptions | undefined =
			this.reflector.get<SecurityTokenGuardOptions>(
				SECURITY_TOKEN_GUARD_OPTIONS,
				context.getHandler(),
			);
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

	private decode(token: string): JWTDecode {
		const decoded: JWTDecode = this.authService.verifyToken(token);
		return decoded;
	}

	private async findOwner(email: string, options: SecurityTokenGuardOptions): Promise<User> {
		const { withDeleted } = options;

		const user = await this.userService.findOne({
			where: { email },
			withDeleted: withDeleted,
		});
		if (!user) {
			throw new UnauthorizedException(`${email} user is not existed`);
		}
		return user;
	}
}
