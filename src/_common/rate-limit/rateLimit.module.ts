import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { LoggerModule } from "../../Logger/logger.module.js";
import { RateLimitGuard } from "./rateLimit.guard.js";
import { RateLimitService } from "./rateLimit.service.js";

@Global()
@Module({
	imports: [ConfigModule, LoggerModule],
	providers: [
		RateLimitService,
		{
			provide: "APP_GUARD",
			useClass: RateLimitGuard,
		},
	],
	exports: [RateLimitService],
})
export class RateLimitModule {}
