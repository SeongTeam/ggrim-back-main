import { TestingModule } from "@nestjs/testing";
import { ShowPainting } from "../../../src/modules/painting/dto/response/showPainting.response";
import { Painting } from "../../../src/modules/painting/entities/painting.entity";
import { CreatePaintingDto, operations, ReplacePaintingDto } from "../../generated/dto-types";
import { PaintingService } from "../../../src/modules/painting/painting.service";
import assert from "assert";
import { sortByLocale } from "../../../src/utils/array";
import { pick } from "../../../src/utils/object";
import { PaintingDummy } from "../../_shared/stub/painting.stub";
import { TagDummy } from "../../_shared/stub/tag.stub";
import { StyleDummy } from "../../_shared/stub/style.stub";
import { ArtistDummy } from "../../_shared/stub/artist.stub";
import { faker } from "@faker-js/faker";

export type SearchQuery = NonNullable<
	operations["PaintingController_searchMany"]["parameters"]["query"]
>;

export async function expectSearchedPainting(
	testingModule: TestingModule,
	receivedShowPaintings: ShowPainting[],
	query: SearchQuery,
) {
	expect(receivedShowPaintings).toBeDefined();
	const paintingService = testingModule.get(PaintingService);
	const {
		title: expectedTitleSubSet,
		artistName: expectedArtist,
		tags: expectedTags,
		styles: expectedStyles,
	} = query;
	const receivedPaintings: Painting[] = await paintingService.getManyByIds(
		receivedShowPaintings.map((showPainting) => showPainting.id),
	);

	assert(receivedShowPaintings.length === receivedPaintings.length);

	if (expectedTitleSubSet) {
		const upperExpectedTitleSubset = expectedTitleSubSet.toUpperCase();
		for (const receivedPainting of receivedPaintings) {
			const upperReceivedTitle = receivedPainting.title.toUpperCase();
			expect(upperReceivedTitle.includes(upperExpectedTitleSubset)).toBe(true);
		}
	}

	if (expectedArtist) {
		for (const receivedPainting of receivedPaintings) {
			const receivedArtist = receivedPainting.artist.name;
			expect(receivedArtist).toBe(expectedArtist);
		}
	}

	if (expectedTags) {
		for (const receivedPainting of receivedPaintings) {
			const receivedTagSet = new Set(receivedPainting.tags.map((t) => t.name));
			for (const expectedTag of expectedTags) {
				expect(receivedTagSet.has(expectedTag)).toBe(true);
			}
		}
	}

	if (expectedStyles) {
		for (const receivedPainting of receivedPaintings) {
			const receivedStyleSet = new Set(receivedPainting.styles.map((s) => s.name));
			for (const expectedStyle of expectedStyles) {
				expect(receivedStyleSet.has(expectedStyle)).toBe(true);
			}
		}
	}
}
export async function expectCreatePainting(
	testingModule: TestingModule,
	receivedResBody: ShowPainting,
	requestBody: CreatePaintingDto,
) {
	const paintingService = testingModule.get(PaintingService);
	assert(receivedResBody);
	const expectedBody = requestBody;
	const receivedPainting = (await paintingService.findOne({
		where: { id: receivedResBody?.id },
	}))!;

	expect(receivedPainting).toBeDefined();

	const receivedTagNames = sortByLocale(receivedPainting.tags.map((t) => t.name));
	const expectedTagNames = sortByLocale(expectedBody.tags);
	expect(receivedTagNames).toEqual(expectedTagNames);

	const receivedStyleNames = sortByLocale(receivedPainting.styles.map((s) => s.name));
	const expectedStyleNames = sortByLocale(expectedBody.styles);
	expect(receivedStyleNames).toEqual(expectedStyleNames);

	const receivedArtistName = receivedPainting.artist.name ?? undefined;
	expect(receivedArtistName).toBe(expectedBody.artistName);

	const receivedCompletitionYear = receivedPainting.completition_year ?? undefined;
	expect(receivedCompletitionYear).toBe(expectedBody.completition_year);

	const columns = [
		"title",
		"image_url",
		"description",
		"width",
		"height",
		"image_s3_key",
	] as const;

	expect(pick(receivedPainting, columns)).toEqual(pick(expectedBody, columns));
}

export function transformToReplaceDto(
	paintingStub: PaintingDummy,
	tagStubs: TagDummy[],
	styleStubs: StyleDummy[],
	artistStub: ArtistDummy,
): ReplacePaintingDto {
	const dto = {
		tags: tagStubs.map((stub) => stub.name),
		styles: styleStubs.map((stub) => stub.name),
		completition_year: paintingStub.completition_year!,
		title: paintingStub.title,
		image_url: paintingStub.image_url,
		description: paintingStub.description,
		width: paintingStub.width,
		height: paintingStub.height,
		image_s3_key: paintingStub.image_s3_key,
		artistName: artistStub.name,
	};

	return dto;
}

export async function expectReplacePainting(
	testingModule: TestingModule,
	receivedResBody: ShowPainting,
	requestBody: ReplacePaintingDto,
) {
	const paintingService = testingModule.get(PaintingService);
	assert(receivedResBody);
	const expectedBody = requestBody;
	const receivedPainting = (await paintingService.findOne({
		where: { id: receivedResBody.id },
	}))!;

	expect(receivedPainting).toBeDefined();

	const receivedTagNames = sortByLocale(receivedPainting.tags.map((t) => t.name));
	const expectedTagNames = sortByLocale(expectedBody.tags);
	expect(receivedTagNames).toEqual(expectedTagNames);

	const receivedStyleNames = sortByLocale(receivedPainting.styles.map((s) => s.name));
	const expectedStyleNames = sortByLocale(expectedBody.styles);
	expect(receivedStyleNames).toEqual(expectedStyleNames);

	const receivedArtistName = receivedPainting.artist.name ?? undefined;
	expect(receivedArtistName).toBe(expectedBody.artistName);

	const receivedCompletitionYear = receivedPainting.completition_year ?? undefined;
	expect(receivedCompletitionYear).toBe(expectedBody.completition_year);

	const columns = [
		"title",
		"image_url",
		"description",
		"width",
		"height",
		"image_s3_key",
	] as const;

	expect(pick(receivedPainting, columns)).toEqual(pick(expectedBody, columns));
}

export function factoryBaseCreateDto(artistStub: ArtistDummy): CreatePaintingDto {
	return {
		title: faker.person.middleName(),
		image_url: faker.internet.url(),
		description: "this is new painting",
		width: faker.number.int({ min: 100, max: 1000 }),
		height: faker.number.int({ min: 100, max: 1000 }),
		image_s3_key: faker.commerce.product(),
		tags: [],
		styles: [],
		artistName: artistStub.name,
	};
}
