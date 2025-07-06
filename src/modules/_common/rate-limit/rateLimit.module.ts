import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { LoggerModule } from "../../logger/logger.module.js";
import { RateLimitGuard } from "./rateLimit.guard.js";
import { RateLimitService } from "./rateLimit.service.js";

@Global()
@Module({
	imports: [ConfigModule, LoggerModule],
	providers: [RateLimitService, RateLimitGuard],
	exports: [RateLimitService, RateLimitGuard],
})
export class RateLimitModule {}
