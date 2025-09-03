import z from "zod";
import { zShowPainting } from "../painting/zodSchema";

// ShowArtist 클래스에 대응되는 스키마
export const zShowArtist = z.object({
	id: z.string(),
	name: z.string(),
	image_url: z.string().nullable(),
	birth_date: z.string().nullable(), // API 응답이 문자열이면 z.string().datetime().nullable()
	death_date: z.string().nullable(), // 동일하게 z.string().datetime().nullable()
	info_url: z.string().nullable(),
});

// ShowArtistResponse 클래스에 대응되는 스키마
export const zShowArtistResponse = zShowArtist.extend({
	shortPaintings: z.array(zShowPainting),
});
