import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { BasicTokenGuard } from './guard/basic-auth.guard';
import { TokenAuthGuard } from './guard/token-auth.guard';

@Module({
  imports: [JwtModule, forwardRef(() => UserModule)],
  controllers: [AuthController],
  providers: [AuthService, BasicTokenGuard, TokenAuthGuard],
  exports: [AuthService],
})
export class AuthModule {}
