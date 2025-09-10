import { OmitType } from "@nestjs/swagger";
import { CustomBaseEntityStub, factoryCustomBaseStub } from "./customBaseEntity.stub";
import { Tag } from "../../../src/modules/tag/entities/tag.entity";
import { faker } from "@faker-js/faker";

export class TagDummy extends OmitType(Tag, ["paintings"]) {}

export const factoryTagStub = (): TagDummy => {
	const name = faker.location.city() + "+" + faker.commerce.productName();

	return {
		id: faker.string.uuid(),
		name,
		info_url: faker.internet.url(),
		search_name: name.trim().split(/\s+/).join("_").toUpperCase(),
		...factoryCustomBaseStub(),
	};
};

export const getTagStubList = (): TagDummy[] => {
	return [
		{
			id: "02282f04-5a66-4dfe-aad5-d1bc3dffc7b3",
			name: "Classical sculpture",
			info_url: "",
			...CustomBaseEntityStub(),
			search_name: "Classical sculpture".trim().split(/\s+/).join("_").toUpperCase(),
		},
		{
			id: "02282f04-117b-4dfe-408c-e465da9a8bad",
			name: "horses",
			info_url: "",

			...CustomBaseEntityStub(),
			search_name: "horses".trim().split(/\s+/).join("_").toUpperCase(),
		},
		{
			id: "02282f04-117b-4dfe-408c-382cdff8414a",
			name: "Town",
			info_url: "",
			...CustomBaseEntityStub(),
			search_name: "Town".trim().split(/\s+/).join("_").toUpperCase(),
		},
		{
			id: "02282f04-117b-4dfe-408c-5781dc52ae60",
			name: "Darkness",
			info_url: "",
			...CustomBaseEntityStub(),
			search_name: "Darkness".trim().split(/\s+/).join("_").toUpperCase(),
		},
	];
};
