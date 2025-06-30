import { PartialType } from "@nestjs/mapped-types";
import { TYPE_DEFAULT_VALUE } from "../../../_common/const/default.value";
import { WikiArtPainting } from "../../entities/wikiArt-painting.entity";

export class UpdateWikiArtInfoDTO extends PartialType(WikiArtPainting) {
	wikiArtId: string = TYPE_DEFAULT_VALUE.string;
}
