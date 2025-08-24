import { OmitType } from "@nestjs/swagger";
import { Artist } from "../../../src/modules/artist/entities/artist.entity";
import { CustomBaseEntityStub } from "../_common/customBaseEntity.stub";

class ArtistDummy extends OmitType(Artist, ["paintings"]) {}

export const getArtistStubList = (): ArtistDummy[] => {
	return [
		{
			id: "550e8400-e29b-41d4-a716-446655440000",
			name: "Leonardo da Vinci",
			image_url: "https://example.com/images/leonardo.jpg",
			// birth_date: new Date("1452-04-15"),
			// death_date: new Date("1519-05-02"),
			birth_date: null,
			death_date: null,
			info_url: "https://en.wikipedia.org/wiki/Leonardo_da_Vinci",

			...CustomBaseEntityStub(),
			search_name: "Leonardo da Vinci".trim().split(/\s+/).join("_").toUpperCase(),
		},
		{
			id: "6fa459ea-ee8a-3ca4-894e-db77e160355e",
			name: "Vincent van Gogh",
			image_url: "https://example.com/images/vangogh.jpg",
			// birth_date: new Date("1853-03-30"),
			// death_date: new Date("1890-07-29"),
			birth_date: null,
			death_date: null,
			info_url: "https://en.wikipedia.org/wiki/Vincent_van_Gogh",

			...CustomBaseEntityStub(),
			search_name: "Vincent van Gogh".trim().split(/\s+/).join("_").toUpperCase(),
		},
		{
			id: "1b4e28ba-2fa1-11d2-883f-0016d3cca427",
			name: "Claude Monet",
			image_url: "https://example.com/images/monet.jpg",
			// birth_date: new Date("1840-11-14"),
			// death_date: new Date("1926-12-05"),
			birth_date: null,
			death_date: null,
			info_url: "https://en.wikipedia.org/wiki/Claude_Monet",

			...CustomBaseEntityStub(),
			search_name: "Claude Monet".trim().split(/\s+/).join("_").toUpperCase(),
		},
		{
			id: "7d444840-9dc0-11d1-b245-5ffdce74fad2",
			name: "Rembrandt",
			image_url: "https://example.com/images/rembrandt.jpg",
			// birth_date: new Date("1606-07-15"),
			// death_date: new Date("1669-10-04"),
			birth_date: null,
			death_date: null,
			info_url: "https://en.wikipedia.org/wiki/Rembrandt",

			...CustomBaseEntityStub(),
			search_name: "Rembrandt".trim().split(/\s+/).join("_").toUpperCase(),
		},
		{
			id: "9a7b330a-a736-40f1-9c9d-ff2f6a6e3a1d",
			name: "Michelangelo",
			image_url: "https://example.com/images/michelangelo.jpg",
			birth_date: null,
			death_date: null,
			info_url: "https://en.wikipedia.org/wiki/Michelangelo",
			...CustomBaseEntityStub(),
			search_name: "Michelangelo".trim().split(/\s+/).join("_").toUpperCase(),
		},
	];
};
