import { TypeOrmCrudService } from "@dataui/crud-typeorm";
import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ServiceException } from "../_common/filter/exception/service/service-exception";
import { isArrayEmpty } from "../utils/validator";
import { Artist } from "./entities/artist.entity";

@Injectable()
export class ArtistService extends TypeOrmCrudService<Artist> {
	constructor(@InjectRepository(Artist) repo: Repository<Artist>) {
		super(repo);
	}

	async getArtistsHavingPainting(): Promise<Artist[]> {
		const query = this.repo
			.createQueryBuilder("artist")
			.innerJoin("artist.paintings", "painting")
			.select(["artist.name", "artist.id"]);

		Logger.debug(query.getSql());

		return query.getMany();
	}

	async validateName(name: string) {
		/*TODO
      - 쿼리 없이, 검증하는 로직 구현 필요
        - 방법1) : 앱내에서 값을 갖고 있는다.
          - 어떻게 앱내의 값을 갱신할 것인가?
    */
		const query = this.repo
			.createQueryBuilder("artist")
			.leftJoinAndSelect("artist.paintings", "painting")
			.where("artist.name = :artistName", { artistName: name });

		Logger.debug(query.getSql());

		const artists = await query.getMany();

		if (isArrayEmpty(artists)) {
			throw new ServiceException(
				"ENTITY_NOT_FOUND",
				"BAD_REQUEST",
				`name(${name}) is not found `,
			);
		}

		const isHavingPainting = artists.every((artist) => artist.paintings);

		if (!isHavingPainting) {
			throw new ServiceException(
				"ENTITY_NOT_FOUND",
				"BAD_REQUEST",
				`name(${name}) has no painting`,
			);
		}
	}
}
