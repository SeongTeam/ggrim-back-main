import { OmitType } from "@nestjs/swagger";
import { factoryCustomBaseStub } from "./customBaseEntity.stub";
import { Tag } from "../../../src/modules/tag/entities/tag.entity";
import { faker } from "@faker-js/faker";
import { generateId } from "./utils";

export class TagDummy extends OmitType(Tag, ["paintings"]) {}

export const factoryTagStub = (): TagDummy => {
	const name =
		faker.location.city() + "+" + faker.commerce.productName() + faker.number.int().toString();

	return {
		id: generateId(),
		name,
		info_url: faker.internet.url(),
		search_name: name.trim().split(/\s+/).join("_").toUpperCase(),
		...factoryCustomBaseStub(),
	};
};
