import {
  Body,
  Controller,
  forwardRef,
  Get,
  Inject,
  Param,
  Post,
  Request,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { QueryRunner } from 'typeorm';
import { ENV_EMAIL_TEST_ADDRESS } from '../_common/const/env-keys.const';
import { ServiceException } from '../_common/filter/exception/service/service-exception';
import { DBQueryRunner } from '../db/query-runner/decorator/query-runner.decorator';
import { QueryRunnerInterceptor } from '../db/query-runner/query-runner.interceptor';
import { MailService } from '../mail/mail.service';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';
import { RegisterDTO } from './dto/register.dto';
import { SignInResponse } from './dto/response/sign-in.response.dto';
import { VerifyDTO } from './dto/verify.dto';
import { Verification } from './entity/verification.entity';
import { BasicTokenGuard } from './guard/authentication/basic.guard';
import { TokenAuthGuard } from './guard/authentication/bearer.guard';

@Controller('auth')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class AuthController {
  constructor(
    @Inject(AuthService) private readonly service: AuthService,
    @Inject(forwardRef(() => UserService)) private readonly userService: UserService,
    @Inject(MailService) private readonly mailService: MailService,
  ) {}

  @Post('sign-in')
  @UseGuards(BasicTokenGuard)
  async signin(@Request() request: any) {
    const authResult = request['BasicTokenGuardResult'];

    const accessToken = this.service.signToken({
      ...authResult,
      type: 'ACCESS',
      purpose: 'access',
    });
    const refreshToken = this.service.signToken({
      ...authResult,
      type: 'REFRESH',
      purpose: 'refresh',
    });

    const response: SignInResponse = {
      accessToken,
      refreshToken,
      email: authResult.email,
    };

    return response;
  }

  @Post('test')
  @UseGuards(TokenAuthGuard)
  async testTokenAuthGuard(@Request() request: any) {
    const result = request['TokenAuthGuardResult'];
    return 'authResult';
  }

  // TODO: 인증 로직 개선
  // - [x] 로직 직접 테스트하기
  // - [ ]  emailModule 사용하여 이메일 인증 로직 추가하기
  // ! 주의: <경고할 사항>
  // ? 질문: registerMethod에서 이미 인증된 계정인 경우, 어떻게 해야하는가?
  // * 참고: <관련 정보나 링크>

  @Post('register')
  @UseInterceptors(QueryRunnerInterceptor)
  async register(
    @DBQueryRunner() qr: QueryRunner,
    @Body() registerDTO: RegisterDTO,
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
    let verification = await this.service.findVerification({ where: { email } });

    //TODO
    if (!verification) {
      verification = await this.service.createVerification(qr, email);
    } else {
      const delay = this.service.getReVerifyDelay(verification);
      if (delay > 0) {
        throw new ServiceException(
          'BASE',
          'FORBIDDEN',
          `retry later ${delay} second. Email is on verifying`,
        );
      }
      const pin_code = this.service.generatePinCode();
      const hashedPinCode = await this.service.hash(pin_code);
      const pin_code_expired_date = this.service.getVerificationExpiredTime();
      await this.service.updateVerification(qr, verification.id, {
        pin_code: hashedPinCode,
        pin_code_expired_date,
        is_verified: false,
      });
      verification.pin_code = pin_code;
      verification.pin_code_expired_date = pin_code_expired_date;
    }

    await this.mailService.sendCertificationPinCode(email, verification.pin_code);

    return verification;
  }

  // TODO 이메일 인증 로직 개선
  // [ ] : oneTimeToken을 발행하여 인증 여부 확인하기.
  @Post(':email/verify')
  @UseInterceptors(QueryRunnerInterceptor)
  async verify(
    @DBQueryRunner() qr: QueryRunner,
    @Param('email') email: string,
    @Body() dto: VerifyDTO,
  ): Promise<boolean> {
    const { pinCode } = dto;
    const now = new Date();

    const existedUser = await this.userService.findOne({ where: { email } });
    if (existedUser) {
      throw new ServiceException(
        'SERVICE_RUN_ERROR',
        'FORBIDDEN',
        `${email} is already existed user`,
      );
    }

    const verification = await this.service.findVerification({ where: { email } });

    if (!verification) {
      throw new ServiceException('ENTITY_NOT_FOUND', 'FORBIDDEN', `${email} is not registered`);
    }

    if (now > verification.pin_code_expired_date) {
      throw new ServiceException('BASE', 'FORBIDDEN', `expired verification`);
    }

    const is_verified = await this.service.isHashMatched(pinCode, verification.pin_code);

    if (!is_verified) {
      throw new ServiceException('BASE', 'FORBIDDEN', `pin code is invalid`);
    }

    await this.service.updateVerification(qr, verification.id, { is_verified });

    return is_verified;
  }

  @Get('emailTest')
  async sendEmail() {
    const testCode = `12345`;
    const email = process.env[ENV_EMAIL_TEST_ADDRESS]!;

    await this.mailService.sendCertificationPinCode(email, testCode);

    return true;
  }
}
