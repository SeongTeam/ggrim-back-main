import z from "zod";

export function expectResponseBody<Z extends z.ZodType>(zObject: Z, body: unknown) {
	expect(() => zObject.parse(body)).not.toThrow();
}
