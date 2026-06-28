import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PW_HASH } from "./modules/_common/const/envKeys";

@Injectable()
export class AppService implements OnModuleInit {
	constructor(private readonly configService: ConfigService) {}

	onModuleInit() {
		if (this.configService.getOrThrow<string>(PW_HASH) === "false") {
			Logger.warn(
				"password is not hashed. if it is not intended, please set hash true",
				AppService.name,
			);
		}
	}

	getHello(): string {
		return "Hello World!";
	}
}
