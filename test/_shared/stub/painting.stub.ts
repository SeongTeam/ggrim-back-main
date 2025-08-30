import { OmitType } from "@nestjs/swagger";
import { Painting } from "../../../src/modules/painting/entities/painting.entity";
import { CustomBaseEntityStub, factoryCustomBaseStub } from "./customBaseEntity.stub";
import { faker } from "@faker-js/faker";

export class PaintingDummy extends OmitType(Painting, ["artist", "styles", "tags"]) {}

export const factoryPaintingStub = (): PaintingDummy => {
	const title = faker.person.fullName();
	return {
		title,
		id: faker.string.uuid(),
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

export const getPaintingStubList = (): PaintingDummy[] => {
	return [
		{
			id: "00058112-8661-4631-81a0-b205c6503355",
			title: "Sunrise",
			description: "",
			image_url: "https://uploads4.wikiart.org/images/georgia-o-keeffe/sunrise.jpg!Large.jpg",
			completition_year: 1916,
			width: 690,
			height: 600,
			image_s3_key: "georgia-o-keeffe/sunrise.jpg!Large.jpg",
			searchTitle: "Sunrise".trim().split(/\s+/).join("_").toUpperCase(),
			...CustomBaseEntityStub(),
		},
		{
			id: "00058112-8661-4631-81a0-bdc8b014fd88",
			title: "Entering a Village",
			description: "",
			image_url:
				"https://uploads6.wikiart.org/images/camille-pissarro/entering-a-village.jpg!Large.jpg",
			completition_year: 1863,
			width: 750,
			height: 569,
			image_s3_key: "camille-pissarro/entering-a-village.jpg!Large.jpg",
			searchTitle: "Entering a Village".trim().split(/\s+/).join("_").toUpperCase(),
			...CustomBaseEntityStub(),
		},
		{
			id: "00058112-8661-4631-81a0-d949cc28f9ea",
			title: "Egyptian Chess Players",
			description: "",
			image_url:
				"https://uploads1.wikiart.org/images/alma-tadema-lawrence/egyptian-chess-players-1865.jpg!Large.jpg",
			completition_year: 1865,
			width: 750,
			height: 511,
			image_s3_key: "alma-tadema-lawrence/egyptian-chess-players-1865.jpg!Large.jpg",
			searchTitle: "Egyptian Chess Players".trim().split(/\s+/).join("_").toUpperCase(),
			...CustomBaseEntityStub(),
		},
		{
			id: "00058112-8661-4631-81a0-d4e57290b8dd",
			title: "The Hungry Lion Throws Itself on the Antelope",
			description: "",
			image_url:
				"https://uploads3.wikiart.org/images/henri-rousseau/the-hungry-lion-throws-itself-on-the-antelope-1905(4).jpg!Large.jpg",
			completition_year: 1905,
			width: 750,
			height: 497,
			image_s3_key:
				"henri-rousseau/the-hungry-lion-throws-itself-on-the-antelope-1905(4).jpg!Large.jpg",
			searchTitle: "The Hungry Lion Throws Itself on the Antelope"
				.trim()
				.split(/\s+/)
				.join("_")
				.toUpperCase(),
			...CustomBaseEntityStub(),
		},
		{
			id: "00058112-8661-4631-81a0-efc194eecca7",
			title: "John the Baptist",
			description: "",
			image_url:
				"https://uploads0.wikiart.org/00340/images/caravaggio/john-the-baptist-1.jpg!Large.jpg",
			completition_year: 1604,
			width: 455,
			height: 600,
			image_s3_key: "caravaggio/john-the-baptist-1.jpg!Large.jpg",
			searchTitle: "John the Baptist".trim().split(/\s+/).join("_").toUpperCase(),
			...CustomBaseEntityStub(),
		},
	];
};
