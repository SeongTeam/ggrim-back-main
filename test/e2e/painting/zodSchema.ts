import z from "zod";
import { zShowArtist } from "../artist/zodSchema";
import { zShowTag } from "../tag/zodSchema";
import { zShowStyle } from "../style/zodSchema";

export const zShowPainting = z.object({
	id: z.uuid(),
	title: z.string(),
	image_url: z.url(),
	width: z.number(),
	height: z.number(),
});

export const zShowPaintingResponse = zShowPainting.extend({
	description: z.string(),
	completition_year: z.number().nullable(),
	showTags: z.array(zShowTag),
	showStyles: z.array(zShowStyle),
	showArtist: zShowArtist,
});
