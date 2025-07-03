import { forwardRef, Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MailModule } from "../mail/mail.module";
import { UserModule } from "../user/user.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { OneTimeToken } from "./entity/oneTimeToken.entity";
import { Verification } from "./entity/verification.entity";
import { BasicGuard } from "./guard/authentication/basic.guard";
import { SecurityTokenGuard } from "./guard/authentication/securityToken.guard";
import { TempUserGuard } from "./guard/authentication/tempUser.guard";
import { TokenAuthGuard } from "./guard/authentication/tokenAuth.guard";
import { OwnerGuard } from "./guard/authorization/owner.guard";
import { RolesGuard } from "./guard/authorization/roles.guard";

//TODO : AuthModule 기능 개선
// - [ ] : Guard payload를 추출하는 데코레이터 추가하기

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
		BasicGuard,
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
		BasicGuard,
		RolesGuard,
		SecurityTokenGuard,
		TempUserGuard,
	],
})
export class AuthModule {}
