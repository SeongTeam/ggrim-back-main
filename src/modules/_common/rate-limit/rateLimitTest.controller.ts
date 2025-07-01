import { Controller, Get, UseGuards } from "@nestjs/common";
import { RateLimit } from "./rateLimit.decorator";
import { RateLimitGuard } from "./rateLimit.guard";

@Controller("test-rate-limit")
@UseGuards(RateLimitGuard)
export class RateLimitTestController {
	@Get("limited")
	@RateLimit() // 20 requests per second
	getLimited() {
		return { message: "This is a rate-limited endpoint" };
	}

	@Get("unlimited")
	getUnlimited() {
		return { message: "This endpoint is not rate limited" };
	}

	@Get("limited-with-option")
	@RateLimit({ ttl: 5000, limit: 5 })
	getLimitedWithOption() {
		return { message: "This is a rate-limited endpoint" };
	}
}
