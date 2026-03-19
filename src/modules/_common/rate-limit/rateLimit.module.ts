import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { RateLimitGuard } from "./rateLimit.guard";
import { RateLimitService } from "./rateLimit.service";

@Global()
@Module({
	imports: [ConfigModule],
	providers: [RateLimitService, RateLimitGuard],
	exports: [RateLimitService, RateLimitGuard],
})
export class RateLimitModule {}
