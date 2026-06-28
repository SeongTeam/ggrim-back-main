import { OmitType } from "@nestjs/swagger";
import { Painting } from "../../../src/modules/painting/entities/painting.entity";
import { factoryCustomBaseStub } from "./customBaseEntity.stub";
import { faker } from "@faker-js/faker";
import { generateId } from "./utils";

export class PaintingDummy extends OmitType(Painting, ["artist", "styles", "tags"]) {}

export const factoryPaintingStub = (): PaintingDummy => {
	const title = faker.person.fullName();
	return {
		title,
		id: generateId(),
		description: faker.commerce.productDescription(),
		completition_year: faker.number.int({ min: 1600, max: 1910 }),
		width: faker.number.int({ min: 300, max: 1000 }),
		height: faker.number.int({ min: 300, max: 1000 }),
		image_url: faker.internet.url(),
		searchTitle: title.trim().split(/\s+/).join("_").toUpperCase(),
		image_s3_key: title,
		...factoryCustomBaseStub(),
	};
};
