import { PartialType } from "@nestjs/mapped-types";
import { TYPE_DEFAULT_VALUE } from "../../../_common/const/defaultValue";
import { WikiArtPainting } from "../../entities/wikiArtPainting.entity";

export class UpdateWikiArtInfoDTO extends PartialType(WikiArtPainting) {
	wikiArtId: string = TYPE_DEFAULT_VALUE.string;
}
