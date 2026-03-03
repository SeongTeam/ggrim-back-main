import { z } from "zod";
import { zShowPainting } from "../painting/zodSchema";

// ShowStyle 클래스 대응
export const zShowTag = z.object({
	id: z.string(),
	name: z.string(),
	info_url: z.string().nullable(),
});

// ShowStyleResponse 클래스 대응
export const zShowTagResponse = zShowTag.extend({
	shortPaintings: z.array(zShowPainting).optional(),
});
