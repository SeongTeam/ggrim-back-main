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
import { User } from "../../../user/entity/user.entity";
import { UserService } from "../../../user/user.service";
import { AuthService } from "../../auth.service";
import { PURPOSE_ONE_TIME_TOKEN_KEY } from "../../metadata/purposeOneTimeToken";
import { OneTimeTokenPurpose } from "../../entity/oneTimeToken.entity";
import { AUTH_GUARD_PAYLOAD, ONE_TIME_TOKEN_HEADER } from "../const";
import { Request } from "express";
import { JWTDecode } from "../../types/jwt";

//Guard doesn't check User Table.
//Guard doesn't Update OneTimeToken Table.
//It just validate OneTimeToken data from client

@Injectable()
export class TempUserGuard implements CanActivate {
	constructor(
		@Inject(AuthService) private readonly authService: AuthService,
		@Inject(forwardRef(() => UserService)) private readonly userService: UserService,
		private readonly reflector: Reflector, //
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const { oneTimeToken, oneTimeTokenID, handlerPurpose, decoded, user } =
			await this.extractData(context);
		this.validate(decoded, handlerPurpose, user);

		await this.verify(oneTimeToken, oneTimeTokenID);

		const req = context.switchToHttp().getRequest<Request>();
		req[AUTH_GUARD_PAYLOAD.TEMP_USER] = {
			oneTimeToken,
			oneTimeTokenID,
			email: decoded.email,
		};

		return true;
	}

	async extractData(context: ExecutionContext) {
		const req = context.switchToHttp().getRequest<Request>();

		const oneTimeToken = req.headers[ONE_TIME_TOKEN_HEADER.X_ONE_TIME_TOKEN] as string;
		const oneTimeTokenID = req.headers[ONE_TIME_TOKEN_HEADER.X_ONE_TIME_TOKEN_ID] as string;
		const handlerPurpose = this.reflector.get<OneTimeTokenPurpose>(
			PURPOSE_ONE_TIME_TOKEN_KEY,
			context.getHandler(),
		);

		if (isEmpty(oneTimeToken)) {
			throw new UnauthorizedException(`Missing or invalid security token header`);
		}

		// check whether token is forged or not .
		if (!(oneTimeTokenID && isUUID(oneTimeTokenID))) {
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

		const decoded = this.decode(oneTimeToken);
		const user: null | User = await this.userService.findUserByEmail(decoded.email);

		return { oneTimeToken, oneTimeTokenID, handlerPurpose, decoded, user };
	}

	private decode(oneTimeToken: string) {
		const decoded: JWTDecode = this.authService.verifyToken(oneTimeToken);
		return decoded;
	}

	private validate(decoded: JWTDecode, handlerPurpose: OneTimeTokenPurpose, user: User | null) {
		const { email, purpose, type } = decoded;

		// will delete logic for logical consistency
		if (user) {
			throw new ServiceException(
				"SERVICE_RUN_ERROR",
				"FORBIDDEN",
				`User already exist. you are not temporary user. ${email} is used.`,
			);
		}

		if (type !== "ONE_TIME") {
			throw new UnauthorizedException(`Can't access Without one-time-token`);
		}

		if (handlerPurpose !== purpose) {
			throw new UnauthorizedException(`purpose is not proper to handler`);
		}
	}

	private async verify(oneTimeToken: string, oneTimeTokenID: string) {
		const entity = await this.authService.findOneTimeToken({ where: { id: oneTimeTokenID } });
		if (!entity) {
			throw new UnauthorizedException(`invalid token ID. ${oneTimeTokenID}`);
		}

		const isHashMatched = await this.authService.isHashMatched(oneTimeToken, entity.token);

		if (!isHashMatched) {
			throw new UnauthorizedException(
				`invalid oneTimeToken. it is not matched. ${oneTimeToken}`,
			);
		}
		if (entity.used_date) {
			throw new UnauthorizedException(
				`invalid oneTimeToken. it is already used. ${entity.used_date.getDate()}`,
			);
		}
	}
}
