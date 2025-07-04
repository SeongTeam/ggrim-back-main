import { SetMetadata } from "@nestjs/common";
import { RATE_LIMIT_METADATA } from "../../const/envKeys";
import { RateLimitOptions } from "../types/RateLimitOptions";

/**
 * RateLimit decorator for applying rate limiting to controller methods
 *
 * When no options are provided, it will use the values from environment variables:
 * - RATE_LIMIT_COUNT: Maximum number of requests (default: 20)
 * - RATE_LIMIT_TTL: Time window in seconds (default: 1)
 *
 * @param options - Optional rate limiting options that override environment variables
 * @example
 * // Use environment variable values
 * @RateLimit()
 *
 * // Override TTL (in seconds)
 * @RateLimit({ ttl: 1 }) // 1 second window
 *
 * // Override both TTL and limit
 * @RateLimit({ ttl: 5, limit: 10 }) // 10 requests per 5 seconds
 */
export const RateLimit = (options: RateLimitOptions = {}) => {
	// The actual values will be read from environment variables in RateLimitService
	// This just passes through the options to be used as overrides
	return SetMetadata(RATE_LIMIT_METADATA, options);
};
