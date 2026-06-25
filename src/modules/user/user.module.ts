import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "../auth/auth.module";
import { User } from "./entity/user.entity";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";
import { DeletedUserService } from "./deleted-user.service";

@Module({
	imports: [TypeOrmModule.forFeature([User]), forwardRef(() => AuthModule)],
	controllers: [UserController],
	providers: [UserService, DeletedUserService],
	exports: [UserService],
})
export class UserModule {}
