import { OmitType } from "@nestjs/swagger";
import { Style } from "../../../src/modules/style/entities/style.entity";
import { factoryCustomBaseStub } from "./customBaseEntity.stub";
import { faker } from "@faker-js/faker";
import { generateId } from "./utils";

export class StyleDummy extends OmitType(Style, ["paintings"]) {}

export const factoryStyleStub = (): StyleDummy => {
	const name = faker.location.streetAddress() + "+" + faker.book.series();

	return {
		id: generateId(),
		name,
		info_url: faker.internet.url(),
		search_name: name.trim().split(/\s+/).join("_").toUpperCase(),
		...factoryCustomBaseStub(),
	};
};
