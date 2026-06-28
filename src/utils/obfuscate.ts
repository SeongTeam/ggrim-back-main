import { isString } from "class-validator";
import Sqids from "sqids";

export class ObfuscateUtil {
	private static OBFUSCATE_CONFIG = {
		maxIdLength: 40,
		maxIdValue: 2 ** 31 - 1,
		allowedChars: /^[a-zA-Z0-9]+$/, // 서비스에 설정된 알파벳에 맞게 조정
		isObfuscate: false,
		defaultPrefix: "IDis",
	};

	private static sqids = new Sqids({
		alphabet: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
		minLength: 6,
	});
	static initialize({
		isObfuscate,
		alphabet,
		minLength,
	}: {
		isObfuscate: boolean;
		alphabet: string;
		minLength: number;
	}) {
		this.OBFUSCATE_CONFIG.isObfuscate = isObfuscate;

		this.sqids = new Sqids({
			alphabet: alphabet,
			minLength: minLength,
		});
		console.log(`ObfuscateUtil initialized`, this.OBFUSCATE_CONFIG);
		// console.debug(
		// 	process.env[ENV_OBFUSCATE],
		// 	process.env[ENV_OBFUSCATE_ALPHABET],
		// 	process.env[ENV_OBFUSCATE_MIN_LENGTH],
		// 	`isProduction: ${process.env[NODE_ENV] === "production"}`,
		// 	`appName: ${process.env[APP_NAME_KEY] || "App_NAME_UNDEFINED"}`,
		// );
	}
	static obfuscateId(id: number): string {
		if (!this.OBFUSCATE_CONFIG.isObfuscate) {
			return `${this.OBFUSCATE_CONFIG.defaultPrefix}${id}`;
		}

		return this.sqids.encode([id]);
	}

	static deobfuscateId(obfuscatedId: string): number {
		if (!this.OBFUSCATE_CONFIG.isObfuscate) {
			const rawId = obfuscatedId.slice(this.OBFUSCATE_CONFIG.defaultPrefix.length);

			try {
				const id = Number(rawId);
				return id;
			} catch (err) {
				throw err;
			}
		}
		const decoded = this.sqids.decode(obfuscatedId);
		if (decoded.length === 0) {
			throw new Error(`Failed to deobfuscate id: ${obfuscatedId}`);
		}

		return decoded[0];
	}

	static validateObfuscated(obfuscated: unknown): obfuscated is string {
		if (isString(obfuscated) === false) {
			return false;
		}

		if (!obfuscated || obfuscated.trim() === "") {
			return false;
		}

		if (obfuscated.length > this.OBFUSCATE_CONFIG.maxIdLength) {
			return false;
		}

		if (!this.OBFUSCATE_CONFIG.isObfuscate) {
			const rawId = obfuscated.slice(this.OBFUSCATE_CONFIG.defaultPrefix.length);
			const regExr = /^\d+$/;
			return regExr.test(rawId);
		}

		return this.OBFUSCATE_CONFIG.allowedChars.test(obfuscated);
	}

	static validateDeobfuscated(id: number): id is number {
		if (id > this.OBFUSCATE_CONFIG.maxIdValue) {
			return false;
		}

		return true;
	}

	static transformToId(obfuscated: unknown): number | null {
		if (!this.validateObfuscated(obfuscated)) {
			return null;
		}
		try {
			const id = this.deobfuscateId(obfuscated);
			if (!this.validateDeobfuscated(id)) {
				return null;
			}
			return id;
		} catch {
			return null;
		}
	}
}
