import { Controller, forwardRef, Inject, Post, Request, UseGuards } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';
import { BasicTokenGuard } from './guard/basic-auth.guard';
import { SignInResponse } from './guard/dto/response/sign-in.response.dto';
import { TokenAuthGuard } from './guard/token-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AuthService) private readonly service: AuthService,
    @Inject(forwardRef(() => UserService)) private readonly userService: UserService,
  ) {}

  @Post('sign-in')
  @UseGuards(BasicTokenGuard)
  async signin(@Request() request: any) {
    const authResult = request['BasicTokenGuardResult'];

    const accessToken = this.service.signToken({
      ...authResult,
      type: 'ACCESS',
    });
    const refreshToken = this.service.signToken({
      ...authResult,
      type: 'REFRESH',
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
}
