import z from "zod";
import { zShowPainting } from "../painting/zodSchema";

// ShowArtist 클래스에 대응되는 스키마
export const zShowArtist = z.object({
	id: z.number(),
	name: z.string(),
	image_url: z.string().nullish(),
	birth_date: z.string().nullish(),
	death_date: z.string().nullish(),
	info_url: z.string().nullish(),
});

// ShowArtistResponse 클래스에 대응되는 스키마
export const zShowArtistResponse = zShowArtist.extend({
	shortPaintings: z.array(zShowPainting),
});
