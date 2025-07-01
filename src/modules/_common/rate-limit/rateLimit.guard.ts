import { ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { RATE_LIMIT_METADATA } from "../const/envKeys.const";
import { ServiceException } from "../filter/exception/service/serviceException";
import { RateLimitService } from "./rateLimit.service.js";
import { Request, Response } from "express";

export interface RateLimitOptions {
	ttl?: number;
	limit?: number;
}

@Injectable()
export class RateLimitGuard {
	constructor(
		private readonly reflector: Reflector,
		private readonly rateLimitService: RateLimitService,
	) {}

	canActivate(context: ExecutionContext): boolean {
		const request = context.switchToHttp().getRequest<Request>();

		// Skip OPTIONS requests
		if (request.method === "OPTIONS") {
			return true;
		}

		// Skip if we've already processed this request
		if (request.isRateLimitChecked) {
			return true;
		}
		request.isRateLimitChecked = true;

		const handler = context.getHandler();

		const options = this.reflector.get<RateLimitOptions>(RATE_LIMIT_METADATA, handler) || {};

		// Apply decorator options if they exist, otherwise use service defaults
		const { allowed, remaining, reset } = this.rateLimitService.checkRateLimit(
			this.getClientIp(request),
			request.path,
			options,
		);

		// Set rate limit headers
		const response = context.switchToHttp().getResponse<Response>();
		response.setHeader("X-RateLimit-Allowed", `${allowed}`);
		response.setHeader("X-RateLimit-Remaining", remaining);
		response.setHeader("X-RateLimit-Reset", Math.ceil(reset / 1000)); // Convert to seconds

		if (!allowed) {
			throw new ServiceException("BASE", "TOO_MANY_REQUESTS", "exceed rate limit");
		}

		return allowed;
	}

	private getClientIp(request: Request): string {
		// Check for proxy headers
		const xForwardedFor = request.headers["x-forwarded-for"] as string;
		if (!xForwardedFor) {
			throw new ServiceException(
				"BASE",
				"BAD_REQUEST",
				`request header[x-forwarded-for] field is undefined `,
			);
		}

		// Fall back to connection remote address
		return xForwardedFor.split(",")[0].trim();
	}
}
