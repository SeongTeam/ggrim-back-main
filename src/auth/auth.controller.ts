import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  forwardRef,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Request,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { isNotEmpty } from 'class-validator';
import { QueryRunner } from 'typeorm';
import {
  ENV_EMAIL_TEST_ADDRESS,
  FRONT_ROUTE_RECOVER_ACCOUNT,
  FRONT_ROUTE_UPDATE_PASSWORD,
} from '../_common/const/env-keys.const';
import { ServiceException } from '../_common/filter/exception/service/service-exception';
import { DBQueryRunner } from '../db/query-runner/decorator/query-runner.decorator';
import { QueryRunnerInterceptor } from '../db/query-runner/query-runner.interceptor';
import { MailService } from '../mail/mail.service';
import { User } from '../user/entity/user.entity';
import { UserService } from '../user/user.service';
import { isArrayEmpty } from '../utils/validator';
import { AuthService } from './auth.service';
import { CheckOwner } from './decorator/owner';
import { PurposeOneTimeToken } from './decorator/purpose-one-time-token';
import { CreateOneTimeTokenDTO } from './dto/create-one-time-token.dto';
import { requestVerificationDTO } from './dto/request-verification.dto';
import { SignInResponse } from './dto/response/sign-in.response.dto';
import { SendOneTimeTokenDTO } from './dto/send-one-time-token.dto';
import { VerifyDTO } from './dto/verify.dto';
import { OneTimeToken, OneTimeTokenPurpose } from './entity/one-time-token.entity';
import { Verification } from './entity/verification.entity';
import { BasicGuard } from './guard/authentication/basic.guard';
import { SecurityTokenGuard } from './guard/authentication/security-token.guard';
import { TokenAuthGuard } from './guard/authentication/token-auth.guard';
import { OwnerGuard } from './guard/authorization/owner.guard';
import {
  AuthUserPayload,
  ENUM_AUTH_CONTEXT_KEY,
  SecurityTokenPayload,
} from './guard/type/request-payload';

@Controller('auth')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class AuthController {
  constructor(
    @Inject(AuthService) private readonly service: AuthService,
    @Inject(forwardRef(() => UserService)) private readonly userService: UserService,
    @Inject(MailService) private readonly mailService: MailService,
    @Inject(ConfigService) private readonly configService: ConfigService,
  ) {}

  @Post('sign-in')
  @UseGuards(BasicGuard)
  async signin(@Request() request: any) {
    const userPayload: AuthUserPayload = request[ENUM_AUTH_CONTEXT_KEY.USER];
    const { user } = userPayload;
    const { email, role, username } = user;

    const accessToken = this.service.signToken({
      type: 'ACCESS',
      purpose: 'access',
      email,
      role,
      username,
    });
    const refreshToken = this.service.signToken({
      type: 'REFRESH',
      purpose: 'refresh',
      email,
      role,
      username,
    });

    const response: SignInResponse = {
      accessToken,
      refreshToken,
      email,
    };

    return response;
  }

  @Post('test')
  @UseGuards(TokenAuthGuard)
  async testTokenAuthGuard(@Request() request: any) {
    const result = request[ENUM_AUTH_CONTEXT_KEY.ACCESS_TOKEN];
    return 'authResult';
  }

  // TODO: 인증 로직 개선
  // - [x] 로직 직접 테스트하기
  // - [x]  emailModule 사용하여 이메일 인증 로직 추가하기
  // ! 주의: <경고할 사항>
  // ? 질문: registerMethod에서 이미 인증된 계정인 경우, 어떻게 해야하는가?
  // * 참고: <관련 정보나 링크>

  @Post('request-verification')
  @UseInterceptors(QueryRunnerInterceptor)
  async register(
    @DBQueryRunner() qr: QueryRunner,
    @Body() registerDTO: requestVerificationDTO,
  ): Promise<Verification> {
    const { email } = registerDTO;

    const existedUser = await this.userService.findOne({ where: { email } });
    if (existedUser) {
      throw new ServiceException(
        'SERVICE_RUN_ERROR',
        'FORBIDDEN',
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
    verification.pin_code = pinCode;

    return verification;
  }

  // TODO 이메일 인증 로직 개선
  // [x] : oneTimeToken을 발행하여 인증 여부 확인하기.
  @Post('verify')
  @UseInterceptors(QueryRunnerInterceptor)
  async verify(
    @DBQueryRunner() qr: QueryRunner,
    @Body() dto: VerifyDTO,
  ): Promise<OneTimeToken | null> {
    const { email, pinCode } = dto;

    const existedUser = await this.userService.findOne({ where: { email } });
    if (existedUser) {
      throw new ServiceException(
        'SERVICE_RUN_ERROR',
        'FORBIDDEN',
        `${email} is already existed user`,
      );
    }

    const verifications: Verification[] = await this.service.findVerificationList({
      where: { email },
      order: { created_date: 'DESC' },
    });
    if (isArrayEmpty(verifications)) {
      throw new ServiceException('ENTITY_NOT_FOUND', 'FORBIDDEN', `${email} is not registered`);
    }

    const now = new Date();
    const latestVerification: Verification = verifications[0];
    if (now > latestVerification.pin_code_expired_date) {
      throw new ServiceException('BASE', 'FORBIDDEN', `expired verification`);
    }
    const delay = this.service.getVerifyDelay(latestVerification);
    if (delay > 0) {
      throw new ServiceException('BASE', 'TOO_MANY_REQUESTS', `please retry ${delay}s`);
    }

    if (isNotEmpty(latestVerification.verification_success_date)) {
      throw new ServiceException('BASE', 'FORBIDDEN', `already verified pin-code`);
    }

    const isVerified = await this.service.isHashMatched(pinCode, latestVerification.pin_code);

    if (!isVerified) {
      await this.service.updateVerification(qr, latestVerification.id, { last_verified_date: now });
      return null;
    }
    await this.service.updateVerification(qr, latestVerification.id, {
      last_verified_date: now,
      verification_success_date: now,
    });
    const oneTimeToken: OneTimeToken = await this.createOneTimeToken(
      qr,
      email,
      'email-verification',
    );
    return oneTimeToken;
  }

  @Post('security-token')
  @UseGuards(BasicGuard)
  @UseInterceptors(QueryRunnerInterceptor)
  async generateSecurityActionToken(
    @DBQueryRunner() qr: QueryRunner,
    @Request() request: any,
    @Body() dto: CreateOneTimeTokenDTO,
  ): Promise<OneTimeToken> {
    const { purpose } = dto;
    const userPayload: AuthUserPayload = request[ENUM_AUTH_CONTEXT_KEY.USER];
    const user = userPayload.user;
    const { email } = user;
    const securityToken = await this.createOneTimeToken(qr, email, purpose, user!);

    return securityToken;
  }

  @Post('security-token/send')
  @UseInterceptors(QueryRunnerInterceptor)
  async sendSecurityActionToken(
    @DBQueryRunner() qr: QueryRunner,
    @Body() dto: SendOneTimeTokenDTO,
  ): Promise<string> {
    const { email, purpose } = dto;
    const withDeleted = purpose === 'recover-account';
    const user: User | null = await this.userService.findOne({ where: { email }, withDeleted });

    if (!user) {
      throw new ServiceException('ENTITY_NOT_FOUND', 'FORBIDDEN', `user is not existed. ${email}`);
    }
    let proxyUrl: string = '';
    let securityToken: OneTimeToken | null = null;
    let url: string = '';

    switch (purpose) {
      case 'update-password':
        proxyUrl = this.configService.getOrThrow<string>(FRONT_ROUTE_UPDATE_PASSWORD);
        securityToken = await this.createOneTimeToken(qr, email, purpose, user);
        url = `${proxyUrl}?identifier=${securityToken.id}&token=${securityToken.token}`;
        await this.mailService.sendSecurityTokenLink(email, 'Update Forgotten password', url);
        break;
      case 'recover-account':
        proxyUrl = this.configService.getOrThrow<string>(FRONT_ROUTE_RECOVER_ACCOUNT);
        securityToken = await this.createOneTimeToken(qr, email, purpose, user);
        url = `${proxyUrl}?identifier=${securityToken.id}&token=${securityToken.token}`;
        await this.mailService.sendSecurityTokenLink(email, 'Recover Account', url);
        break;
      default:
        throw new ServiceException(
          'NOT_IMPLEMENTED',
          'NOT_IMPLEMENTED',
          'logic is partially implemented',
        );
    }

    return 'send email';
  }

  @Get('emailTest')
  async sendEmail() {
    const testCode = `12345`;
    const email = process.env[ENV_EMAIL_TEST_ADDRESS]!;

    await this.mailService.sendVerificationPinCode(email, testCode);

    return true;
  }

  @Post('test/one-time-token-guard')
  @PurposeOneTimeToken('delete-account')
  @UseGuards(SecurityTokenGuard)
  @UseInterceptors(QueryRunnerInterceptor)
  async testSecurityTokenGuard(@DBQueryRunner() qr: QueryRunner, @Request() request: any) {
    const SecurityTokenGuardResult: SecurityTokenPayload =
      request[ENUM_AUTH_CONTEXT_KEY.SECURITY_TOKEN];
    await this.service.markOneTimeJWT(qr, SecurityTokenGuardResult.oneTimeTokenID);

    //do next task.

    return true;
  }

  @Get('one-time-token/:id')
  @CheckOwner({
    serviceClass: AuthService,
    idParam: 'id',
    ownerField: 'user_id',
    serviceMethod: 'findOneTimeTokenByID',
  })
  @UseGuards(BasicGuard, OwnerGuard)
  @UseInterceptors(ClassSerializerInterceptor) // serialize entity with applying transformer decorator
  async getOneTimeToken(@Param('id', ParseUUIDPipe) id: string): Promise<OneTimeToken | null> {
    const findOne = await this.service.findOneTimeToken({
      where: { id },
    });

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
        'BASE',
        'TOO_MANY_REQUESTS',
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
