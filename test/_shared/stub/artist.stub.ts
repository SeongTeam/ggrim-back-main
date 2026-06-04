import { OmitType } from "@nestjs/swagger";
import { Artist } from "../../../src/modules/artist/entities/artist.entity";
import { factoryCustomBaseStub } from "./customBaseEntity.stub";
import { faker } from "@faker-js/faker";
import { generateId } from "./utils";

export class ArtistDummy extends OmitType(Artist, ["paintings"]) {}

export const factoryArtistStub = (): ArtistDummy => {
	const name = faker.person.fullName();
	const start = new Date(1000, 0, 1);
	const end = new Date(1900, 11, 31);

	// 생일 생성
	const birthDate = faker.date.between({ from: start, to: end });

	// 최소 25년, 최대 80년 후
	const minDeath = new Date(birthDate);
	minDeath.setFullYear(minDeath.getFullYear() + 25);

	const maxDeath = new Date(birthDate);
	maxDeath.setFullYear(maxDeath.getFullYear() + 80);

	// 사망일 생성
	const deathDate = faker.date.between({ from: minDeath, to: maxDeath });

	// yyyy-mm-dd 만 기록
	birthDate.setUTCHours(0, 0, 0, 0);
	deathDate.setUTCHours(0, 0, 0, 0);

	return {
		id: generateId(),
		name,
		image_url: faker.internet.url(),
		info_url: faker.internet.url(),
		birth_date: birthDate,
		death_date: deathDate,
		search_name: name.trim().split(/\s+/).join("_").toUpperCase(),
		...factoryCustomBaseStub(),
	};
};
