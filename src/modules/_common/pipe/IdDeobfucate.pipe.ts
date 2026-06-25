import { PipeTransform, Injectable, BadRequestException } from "@nestjs/common";
import { deobfuscateId, validateDeobfuscated, validateObfuscated } from "../../../utils/obfuscate";

@Injectable()
export class IdDeobfuscatePipe implements PipeTransform<string, number> {
	transform(obfuscated: string): number {
		let message = `${obfuscated} is invalid format ID`;
		if (!validateObfuscated(obfuscated)) {
			throw new BadRequestException(message);
		}
		try {
			const id = deobfuscateId(obfuscated);
			if (!validateDeobfuscated(id)) {
				throw new BadRequestException(message);
			}
			return id;
		} catch (error) {
			if (error instanceof Error) {
				message += error.message;
			}
			throw new BadRequestException(message);
		}
	}
}
