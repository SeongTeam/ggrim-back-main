import { isString } from "class-validator";
import Sqids from "sqids";

const sqids = new Sqids({
	alphabet:
		process.env.ENV_OBFUSCATE_ALPHABET ||
		"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
	minLength: parseInt(process.env.ENV_OBFUSCATE_MIN_LENGTH || "8"),
});

const OBFUSCATE_CONFIG = {
	MAX_ID_LENGTH: 40,
	MAX_ID_VALUE: 2 ** 31 - 1,
	ALLOWED_CHARS: /^[a-zA-Z0-9]+$/, // 서비스에 설정된 알파벳에 맞게 조정
	IS_OBFUSCATE: process.env.ENV_OBFUSCATE === "true",
} as const;
const NOT_OBFUSCATE_PREFIX = `IDis`;

export function obfuscateId(id: number): string {
	if (!OBFUSCATE_CONFIG.IS_OBFUSCATE) {
		return `${NOT_OBFUSCATE_PREFIX}${id}`;
	}

	return sqids.encode([id]);
}

export function deobfuscateId(obfuscatedId: string): number {
	if (!OBFUSCATE_CONFIG.IS_OBFUSCATE) {
		const rawId = obfuscatedId.slice(NOT_OBFUSCATE_PREFIX.length);

		try {
			const id = Number(rawId);
			return id;
		} catch (err) {
			throw err;
		}
	}
	const decoded = sqids.decode(obfuscatedId);
	if (decoded.length === 0) {
		throw new Error(`Failed to deobfuscate id: ${obfuscatedId}`);
	}

	return decoded[0];
}

export function validateObfuscated(obfuscated: unknown): obfuscated is string {
	if (isString(obfuscated) === false) {
		return false;
	}

	if (!obfuscated || obfuscated.trim() === "") {
		return false;
	}

	if (obfuscated.length > OBFUSCATE_CONFIG.MAX_ID_LENGTH) {
		return false;
	}

	if (!OBFUSCATE_CONFIG.IS_OBFUSCATE) {
		const rawId = obfuscated.slice(NOT_OBFUSCATE_PREFIX.length);
		const regExr = /^\d+$/;
		return regExr.test(rawId);
	}

	return OBFUSCATE_CONFIG.ALLOWED_CHARS.test(obfuscated);
}

export function validateDeobfuscated(id: number): id is number {
	if (id > OBFUSCATE_CONFIG.MAX_ID_VALUE) {
		return false;
	}

	return true;
}

export function transformToId(obfuscated: unknown): number | null {
	if (!validateObfuscated(obfuscated)) {
		return null;
	}
	try {
		const id = deobfuscateId(obfuscated);
		if (!validateDeobfuscated(id)) {
			return null;
		}
		return id;
	} catch {
		return null;
	}
}
