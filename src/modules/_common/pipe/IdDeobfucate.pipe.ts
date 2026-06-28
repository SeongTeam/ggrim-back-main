import { PipeTransform, Injectable, BadRequestException } from "@nestjs/common";
import { ObfuscateUtil } from "../../../utils/obfuscate";

@Injectable()
export class IdDeobfuscatePipe implements PipeTransform<string, number> {
	transform(obfuscated: string): number {
		let message = `${obfuscated} is invalid format ID`;
		if (!ObfuscateUtil.validateObfuscated(obfuscated)) {
			throw new BadRequestException(message);
		}
		try {
			const id = ObfuscateUtil.deobfuscateId(obfuscated);
			if (!ObfuscateUtil.validateDeobfuscated(id)) {
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
