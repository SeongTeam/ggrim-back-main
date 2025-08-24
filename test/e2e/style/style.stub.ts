import { OmitType } from "@nestjs/swagger";
import { Style } from "../../../src/modules/style/entities/style.entity";
import { CustomBaseEntityStub } from "../_common/customBaseEntity.stub";

class StyleDummy extends OmitType(Style, ["paintings"]) {}

export const getStyleStubList = (): StyleDummy[] => {
	return [
		{
			id: "1d0f1a06-5a66-4dfe-aad5-d1bc3dffc7b3",
			name: "Abstract Art",
			info_url: "",
			...CustomBaseEntityStub(),
			search_name: "Abstract Art".trim().split(/\s+/).join("_").toUpperCase(),
		},
		{
			id: "1d0f1a06-117b-4dfe-408c-e465da9a8bad",
			name: "Surrealism",
			info_url: "",
			...CustomBaseEntityStub(),
			search_name: "Surrealism".trim().split(/\s+/).join("_").toUpperCase(),
		},
		{
			id: "1d0f1a06-117b-4dfe-408c-382cdff8414a",
			name: "Northern Renaissance",
			info_url: "",
			...CustomBaseEntityStub(),
			search_name: "Northern Renaissance".trim().split(/\s+/).join("_").toUpperCase(),
		},
		{
			id: "1d0f1a06-117b-4dfe-408c-5781dc52ae60",
			name: "Academicism",
			info_url: "",
			...CustomBaseEntityStub(),
			search_name: "Academicism".trim().split(/\s+/).join("_").toUpperCase(),
		},
	];
};
