import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ArtistModule } from "../artist/artist.module";
import { S3Module } from "../aws/s3.module";
import { Style } from "../style/entities/style.entity";
import { StyleModule } from "../style/style.module";
import { StyleService } from "../style/style.service";
import { TagModule } from "../tag/tag.modue";
import { Painting } from "./entities/painting.entity";
import { WikiArtPainting } from "./entities/wikiArt-painting.entity";
import { PaintingController } from "./painting.controller";
import { PaintingService } from "./painting.service";
import { WikiArtPaintingService } from "./sub-service/wikiArt.painting.service";

@Module({
	imports: [
		TypeOrmModule.forFeature([Painting, WikiArtPainting, Style]),
		ArtistModule,
		TagModule,
		StyleModule,
		S3Module,
	],
	controllers: [PaintingController],
	providers: [PaintingService, WikiArtPaintingService, StyleService],
	exports: [PaintingService, WikiArtPaintingService],
})
export class PaintingModule {}
