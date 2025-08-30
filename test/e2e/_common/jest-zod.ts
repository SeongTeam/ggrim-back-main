import { type ZodObject } from "zod";

export function expectResponseBody<Z extends ZodObject>(zObject: Z, body: unknown) {
	expect(() => zObject.parse(body)).not.toThrow();
}
