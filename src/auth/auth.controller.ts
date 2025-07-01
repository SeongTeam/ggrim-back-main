import {
	Body,
	Controller,
	forwardRef,
	Get,
	Inject,
	Param,
	ParseUUIDPipe,
	Post,
	Req,
	UseGuards,
	UseInterceptors,
	UsePipes,
	ValidationPipe,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { isNotEmpty } from "class-validator";
import { QueryRunner } from "typeorm";
import {
	ENV_EMAIL_TEST_ADDRESS,
	FRONT_ROUTE_USER_EMAIL_VERIFICATION,
} from "../_common/const/envKeys.const";
import { ServiceException } from "../_common/filter/exception/service/serviceException";
import { DBQueryRunner } from "../db/query-runner/decorator/queryRunner.decorator";
import { QueryRunnerInterceptor } from "../db/query-runner/queryRunner.interceptor";
import { MailService } from "../mail/mail.service";
import { User } from "../user/entity/user.entity";
import { UserService } from "../user/user.service";
import { isArrayEmpty } from "../utils/validator";
import { AuthService } from "./auth.service";
import { CheckOwner } from "./metadata/owner";
import { PurposeOneTimeToken } from "./metadata/purposeOneTimeToken";
import { SecurityTokenGuardOptions } from "./metadata/securityTokenGuardOption";
import { CreateOneTimeTokenDTO } from "./dto/request/createOneTimeTokenDTO";
import { requestVerificationDTO } from "./dto/request/requestVerificationDTO";
import { SignInResponse } from "./dto/response/signInResponse";
import { SendOneTimeTokenDTO } from "./dto/request/sendOneTimeTokenDTO";
import { VerifyDTO } from "./dto/request/verify.dto";
import { OneTimeToken, OneTimeTokenPurpose } from "./entity/oneTimeToken.entity";
import { Verification } from "./entity/verification.entity";
import { BasicGuard } from "./guard/authentication/basic.guard";
import { SecurityTokenGuard } from "./guard/authentication/securityToken.guard";
import { OwnerGuard } from "./guard/authorization/owner.guard";
import {
	AuthUserPayload,
	AUTH_GUARD_PAYLOAD,
	SecurityTokenPayload,
} from "./guard/types/requestPayload";
import { AuthGuardRequest } from "./guard/types/AuthRequest";

@Controller("auth")
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class AuthController {
	constructor(
		@Inject(AuthService) private readonly service: AuthService,
		@Inject(forwardRef(() => UserService)) private readonly userService: UserService,
		@Inject(MailService) private readonly mailService: MailService,
		@Inject(ConfigService) private readonly configService: ConfigService,
	) {}

	//TODO : 로그인 API 개선
	// - [x] : 로그인 성공시, 사용자 정보 응답하기
	// - [ ] : 로그인 성공 또는 실패에 대한 기록 저장하기

	@Post("sign-in")
	@UseGuards(BasicGuard)
	signin(@Req() request: AuthGuardRequest) {
		const userPayload: AuthUserPayload = request[AUTH_GUARD_PAYLOAD.USER]!;
		const { user } = userPayload;
		const { email, role, username } = user;

		const accessToken = this.service.signToken({
			type: "ACCESS",
			purpose: "access",
			email,
			role,
			username,
		});
		const refreshToken = this.service.signToken({
			type: "REFRESH",
			purpose: "refresh",
			email,
			role,
			username,
		});
		//TODO : 로그인 기록 남기기

		const response: SignInResponse = {
			accessToken,
			refreshToken,
			user,
		};

		return response;
	}

	// TODO: 인증 로직 개선
	// - [x] 로직 직접 테스트하기
	// - [x]  emailModule 사용하여 이메일 인증 로직 추가하기
	// ! 주의: <경고할 사항>
	// ? 질문: registerMethod에서 이미 인증된 계정인 경우, 어떻게 해야하는가?
	// * 참고: <관련 정보나 링크>

	@Post("request-verification")
	@UseInterceptors(QueryRunnerInterceptor)
	async register(
		@DBQueryRunner() qr: QueryRunner,
		@Body() registerDTO: requestVerificationDTO,
	): Promise<Verification> {
		const { email } = registerDTO;

		const existedUser = await this.userService.findOne({ where: { email } });
		if (existedUser) {
			throw new ServiceException(
				"SERVICE_RUN_ERROR",
				"FORBIDDEN",
				`${email} is already existed user`,
			);
		}
		const isEnable = await this.service.isVerifyEnable(email);
		if (!isEnable) {
			throw new ServiceException(
				`RATE_LIMIT_EXCEEDED`,
				`TOO_MANY_REQUESTS`,
				`Too many verification. please retry later`,
			);
		}

		const pinCode = this.service.generatePinCode();
		const verification = await this.service.createVerification(qr, email, pinCode);

		await this.mailService.sendVerificationPinCode(email, pinCode);
		// verification.pin_code = pinCode;

		return verification;
	}

	// TODO 이메일 인증 로직 개선
	// [x] : oneTimeToken을 발행하여 인증 여부 확인하기.
	@Post("verify")
	@UseInterceptors(QueryRunnerInterceptor)
	async verify(
		@DBQueryRunner() qr: QueryRunner,
		@Body() dto: VerifyDTO,
	): Promise<OneTimeToken | null> {
		const { email, pinCode } = dto;

		const existedUser = await this.userService.findOne({ where: { email } });
		if (existedUser) {
			throw new ServiceException(
				"SERVICE_RUN_ERROR",
				"FORBIDDEN",
				`${email} is already existed user`,
			);
		}

		const verifications: Verification[] = await this.service.findVerificationList({
			where: { email },
			order: { created_date: "DESC" },
		});
		if (isArrayEmpty(verifications)) {
			throw new ServiceException(
				"ENTITY_NOT_FOUND",
				"FORBIDDEN",
				`${email} is not registered`,
			);
		}

		const now = new Date();
		const latestVerification: Verification = verifications[0];
		if (now > latestVerification.pin_code_expired_date) {
			throw new ServiceException("BASE", "FORBIDDEN", `expired verification`);
		}
		const delay = this.service.getVerifyDelay(latestVerification);
		if (delay > 0) {
			throw new ServiceException("BASE", "TOO_MANY_REQUESTS", `please retry ${delay}s`);
		}

		if (isNotEmpty(latestVerification.verification_success_date)) {
			throw new ServiceException("BASE", "FORBIDDEN", `already verified pin-code`);
		}

		const isVerified = await this.service.isHashMatched(pinCode, latestVerification.pin_code);

		if (!isVerified) {
			await this.service.updateVerification(qr, latestVerification.id, {
				last_verified_date: now,
			});
			throw new ServiceException("BASE", "FORBIDDEN", `Check pin-code again`);
		}
		await this.service.updateVerification(qr, latestVerification.id, {
			last_verified_date: now,
			verification_success_date: now,
		});
		const oneTimeToken: OneTimeToken = await this.createOneTimeToken(qr, email, "sign-up");
		return oneTimeToken;
	}

	@Post("security-token")
	@UseGuards(BasicGuard)
	@UseInterceptors(QueryRunnerInterceptor)
	async generateSecurityActionToken(
		@DBQueryRunner() qr: QueryRunner,
		@Req() request: AuthGuardRequest,
		@Body() dto: CreateOneTimeTokenDTO,
	): Promise<OneTimeToken> {
		const { purpose } = dto;
		const userPayload: AuthUserPayload = request[AUTH_GUARD_PAYLOAD.USER]!;
		const user = userPayload.user;
		const { email } = user;
		const securityToken = await this.createOneTimeToken(qr, email, purpose, user);

		return securityToken;
	}

	@Post("security-token/email-verification")
	@UseInterceptors(QueryRunnerInterceptor)
	async sendSecurityActionToken(
		@DBQueryRunner() qr: QueryRunner,
		@Body() dto: SendOneTimeTokenDTO,
	): Promise<string> {
		const { email, purpose } = dto;
		const withDeleted = true;
		const user: User | null = await this.userService.findOne({ where: { email }, withDeleted });

		if (!user) {
			throw new ServiceException(
				"ENTITY_NOT_FOUND",
				"FORBIDDEN",
				`user is not existed. ${email}`,
			);
		}
		const proxyUrl: string = this.configService.getOrThrow<string>(
			FRONT_ROUTE_USER_EMAIL_VERIFICATION,
		);
		const securityToken = await this.createOneTimeToken(qr, email, "email-verification", user);
		const url = `${proxyUrl}?identifier=${securityToken.id}&purpose=${purpose}&token=${securityToken.token}`;

		switch (purpose) {
			case "update-password":
				await this.mailService.sendSecurityTokenLink(
					email,
					"Update Forgotten password",
					url,
				);
				break;
			case "recover-account":
				await this.mailService.sendSecurityTokenLink(email, "Recover Account", url);
				break;
			default:
				throw new ServiceException(
					"NOT_IMPLEMENTED",
					"NOT_IMPLEMENTED",
					"logic is partially implemented",
				);
		}

		return "send email";
	}

	@Post("security-token/from-email-verification")
	@UseInterceptors(QueryRunnerInterceptor)
	@PurposeOneTimeToken("email-verification")
	@SecurityTokenGuardOptions({ withDeleted: true })
	@UseGuards(SecurityTokenGuard)
	async generateSecurityTokenByEmailVerification(
		@DBQueryRunner() qr: QueryRunner,
		@Req() request: AuthGuardRequest,
		@Body() dto: CreateOneTimeTokenDTO,
	): Promise<OneTimeToken> {
		const { purpose } = dto;
		const userPayload: AuthUserPayload = request[AUTH_GUARD_PAYLOAD.USER]!;
		const securityTokenPayload: SecurityTokenPayload =
			request[AUTH_GUARD_PAYLOAD.SECURITY_TOKEN]!;
		const { user } = userPayload;

		await this.service.markOneTimeJWT(qr, securityTokenPayload.oneTimeTokenID);

		const { email } = user;
		const securityToken = await this.createOneTimeToken(qr, email, purpose, user);

		return securityToken;
	}

	@Get("emailTest")
	async sendEmail() {
		const testCode = `12345`;
		const email = process.env[ENV_EMAIL_TEST_ADDRESS]!;

		await this.mailService.sendVerificationPinCode(email, testCode);

		return true;
	}

	@Post("test/one-time-token-guard")
	@PurposeOneTimeToken("delete-account")
	@UseGuards(SecurityTokenGuard)
	@UseInterceptors(QueryRunnerInterceptor)
	async testSecurityTokenGuard(
		@DBQueryRunner() qr: QueryRunner,
		@Req() request: AuthGuardRequest,
	) {
		const SecurityTokenGuardResult: SecurityTokenPayload =
			request[AUTH_GUARD_PAYLOAD.SECURITY_TOKEN]!;
		await this.service.markOneTimeJWT(qr, SecurityTokenGuardResult.oneTimeTokenID);

		//do next task.

		return true;
	}

	@Get("one-time-token/:id")
	@CheckOwner({
		serviceClass: AuthService,
		idParam: "id",
		ownerField: "user_id",
		serviceMethod: "findOneTimeTokenByID",
	})
	@UseGuards(BasicGuard, OwnerGuard)
	async getOneTimeToken(@Param("id", ParseUUIDPipe) id: string): Promise<OneTimeToken | null> {
		const findOne = await this.service.findOneTimeToken({ where: { id } });

		return findOne;
	}

	private async createOneTimeToken(
		qr: QueryRunner,
		email: string,
		purpose: OneTimeTokenPurpose,
		user?: User,
	): Promise<OneTimeToken> {
		const isEnable = await this.service.isEnableCreateOneTimeJWT(email);
		if (!isEnable) {
			throw new ServiceException(
				"BASE",
				"TOO_MANY_REQUESTS",
				`request limitation. please retry later `,
			);
		}
		let oneTimeToken: OneTimeToken | null = null;
		if (user) {
			oneTimeToken = await this.service.signOneTimeJWTWithUser(qr, email, purpose, user);
		} else {
			oneTimeToken = await this.service.signOneTimeJWTWithoutUser(qr, email, purpose);
		}

		return oneTimeToken;
	}
}
