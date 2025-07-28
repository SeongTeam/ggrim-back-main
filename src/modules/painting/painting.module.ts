import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ArtistModule } from "../artist/artist.module";
import { S3Module } from "../aws/s3.module";
import { Style } from "../style/entities/style.entity";
import { StyleModule } from "../style/style.module";
import { StyleService } from "../style/style.service";
import { TagModule } from "../tag/tag.modue";
import { Painting } from "./entities/painting.entity";
import { WikiArtPainting } from "./entities/wikiArtPainting.entity";
import { PaintingController } from "./painting.controller";
import { PaintingService } from "./painting.service";
import { AuthModule } from "../auth/auth.module";
import { UserModule } from "../user/user.module";
@Module({
	imports: [
		TypeOrmModule.forFeature([Painting, WikiArtPainting, Style]),
		ArtistModule,
		AuthModule,
		StyleModule,
		S3Module,
		TagModule,
		UserModule,
	],
	controllers: [PaintingController],
	providers: [PaintingService, StyleService],
	exports: [PaintingService],
})
export class PaintingModule {}
