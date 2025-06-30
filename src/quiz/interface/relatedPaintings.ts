import { Painting } from "../../painting/entities/painting.entity";

export interface RelatedPaintings {
	answerPaintings: Painting[];
	distractorPaintings: Painting[];
	examplePainting: Painting | undefined;
}
