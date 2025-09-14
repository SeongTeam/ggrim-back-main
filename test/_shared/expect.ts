import { assert } from "console";
import { Artist } from "../../src/modules/artist/entities/artist.entity";
import { Quiz } from "../../src/modules/quiz/entities/quiz.entity";
import { Style } from "../../src/modules/style/entities/style.entity";
import { Tag } from "../../src/modules/tag/entities/tag.entity";
import { deduplicate, omit, pick, sortById } from "../../src/utils/object";

const ESSENTIAL_QUIZ__FIELD = [
	"answer_paintings",
	"distractor_paintings",
	"description",
	"time_limit",
	"title",
	"owner",
] as const;
export type EssentialQuizField = (typeof ESSENTIAL_QUIZ__FIELD)[number];
export type ExpectedQuizPart = Pick<Quiz, EssentialQuizField>;

export function expectQuizEqual(receivedQuiz: Quiz, expectedQuizPart: ExpectedQuizPart) {
	const cloneReceivedQuiz = structuredClone(receivedQuiz);
	const clonedExpectedQuizPart = structuredClone(expectedQuizPart);

	const receivedQuizPart = pick(cloneReceivedQuiz, ESSENTIAL_QUIZ__FIELD);
	const expectedPaintings = [
		...clonedExpectedQuizPart.answer_paintings,
		...clonedExpectedQuizPart.distractor_paintings,
	];

	const expectedArtists: Artist[] = deduplicate(
		expectedPaintings.map((p) => {
			assert(p.artist);
			return p.artist;
		}),
	);
	const expectedTags: Tag[] = deduplicate(
		expectedPaintings
			.map((p) => {
				assert(p.tags && p.tags.length > 0);
				return p.tags;
			})
			.flat(),
	);
	const expectedStyles: Style[] = deduplicate(
		expectedPaintings
			.map((p) => {
				assert(p.styles && p.styles.length > 0);
				return p.styles;
			})
			.flat(),
	);

	//expect non-relation field
	expect(omit(receivedQuizPart, ["answer_paintings", "distractor_paintings"])).toEqual(
		omit(clonedExpectedQuizPart, ["answer_paintings", "distractor_paintings"]),
	);

	//

	const paintingRelationField = ["artist", "tags", "styles"] as const;
	for (let i = 0; i < cloneReceivedQuiz.distractor_paintings.length; i++) {
		const receivedDistractor = cloneReceivedQuiz.distractor_paintings[i];
		const expectedDistractor = expectedQuizPart.distractor_paintings[i];

		expect(omit(receivedDistractor, paintingRelationField)).toEqual(
			omit(expectedDistractor, paintingRelationField),
		);
	}

	for (let i = 0; i < cloneReceivedQuiz.answer_paintings.length; i++) {
		const receivedAnswer = cloneReceivedQuiz.answer_paintings[i];
		const expectedAnswer = expectedQuizPart.answer_paintings[i];

		expect(omit(receivedAnswer, paintingRelationField)).toEqual(
			omit(expectedAnswer, paintingRelationField),
		);
	}

	expect(sortById(cloneReceivedQuiz.artists)).toEqual(sortById(expectedArtists));
	expect(sortById(cloneReceivedQuiz.styles)).toEqual(sortById(expectedStyles));
	expect(sortById(cloneReceivedQuiz.tags)).toEqual(sortById(expectedTags));
}
