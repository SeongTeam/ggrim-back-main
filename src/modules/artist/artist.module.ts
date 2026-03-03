import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "../auth/auth.module";
import { UserModule } from "../user/user.module";
import { ArtistController } from "./artist.controller";
import { ArtistService } from "./artist.service";
import { Artist } from "./entities/artist.entity";

@Module({
	imports: [TypeOrmModule.forFeature([Artist]), AuthModule, UserModule],
	controllers: [ArtistController],
	providers: [ArtistService],
	exports: [ArtistService],
})
export class ArtistModule {}
