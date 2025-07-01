import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "../auth/auth.module";
import { UserModule } from "../user/user.module";
import { Style } from "./entities/style.entity";
import { StyleController } from "./style.controller";
import { StyleService } from "./style.service";

@Module({
	imports: [TypeOrmModule.forFeature([Style]), AuthModule, UserModule],
	controllers: [StyleController],
	providers: [StyleService],
	exports: [StyleService],
})
export class StyleModule {}
