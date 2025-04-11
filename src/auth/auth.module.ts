import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailModule } from '../mail/mail.module';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OneTimeToken } from './entity/one-time-token.entity';
import { Verification } from './entity/verification.entity';
import { BasicTokenGuard } from './guard/authentication/basic.guard';
import { TokenAuthGuard } from './guard/authentication/bearer.guard';
import { SecurityTokenGuard } from './guard/authentication/security-token.guard';
import { TempUserGuard } from './guard/authentication/temp-user.guard';
import { OwnerGuard } from './guard/authorization/owner.guard';
import { RolesGuard } from './guard/authorization/roles.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Verification, OneTimeToken]),
    JwtModule,
    forwardRef(() => UserModule),
    MailModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    BasicTokenGuard,
    TokenAuthGuard,
    OwnerGuard,
    RolesGuard,
    SecurityTokenGuard,
    TempUserGuard,
  ],
  exports: [
    AuthService,
    OwnerGuard,
    TokenAuthGuard,
    BasicTokenGuard,
    RolesGuard,
    SecurityTokenGuard,
    TempUserGuard,
  ],
})
export class AuthModule {}
