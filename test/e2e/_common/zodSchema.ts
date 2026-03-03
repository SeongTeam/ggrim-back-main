import z from "zod";

export function zPagination<T extends z.ZodTypeAny>(schema: T) {
	return z.object({
		data: z.array(schema),
		page: z.number(),
		total: z.number(),
		count: z.number(),
		pageCount: z.number(),
	});
}
