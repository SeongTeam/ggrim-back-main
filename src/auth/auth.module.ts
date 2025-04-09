import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailModule } from '../mail/mail.module';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OneTimeToken } from './entity/one-time-token.entity';
import { Verification } from './entity/verification.entity';
import { BasicTokenGuard } from './guard/basic-auth.guard';
import { OwnerGuard } from './guard/owner.guard';
import { RolesGuard } from './guard/role.guard';
import { TokenAuthGuard } from './guard/token-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Verification, OneTimeToken]),
    JwtModule,
    forwardRef(() => UserModule),
    MailModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, BasicTokenGuard, TokenAuthGuard, OwnerGuard, RolesGuard],
  exports: [AuthService, OwnerGuard, TokenAuthGuard, BasicTokenGuard, RolesGuard],
})
export class AuthModule {}
