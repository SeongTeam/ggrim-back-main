import { ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RATE_LIMIT_METADATA } from '../const/env-keys.const';
import { RateLimitService } from './rate-limit.service.js';

class ThrottlerException extends Error {
  public status: number;
  public response: {
    statusCode: number;
    message: string;
    retryAfter: number;
  };

  constructor(message: string, retryAfter = 1) {
    super(message);
    this.status = HttpStatus.TOO_MANY_REQUESTS;
    this.response = {
      statusCode: HttpStatus.TOO_MANY_REQUESTS,
      message,
      retryAfter,
    };
  }
}

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

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Skip OPTIONS requests
    if (request.method === 'OPTIONS') {
      return true;
    }

    // Skip if we've already processed this request
    if (request._rateLimitChecked) {
      return true;
    }
    request._rateLimitChecked = true;

    const handler = context.getHandler();

    const options = this.reflector.get<RateLimitOptions>(RATE_LIMIT_METADATA, handler) || {};

    // Apply decorator options if they exist, otherwise use service defaults
    const result = await this.rateLimitService
      .checkRateLimit(this.getClientIp(request), request.path, options)
      .then(({ allowed, remaining, reset }) => {
        // Set rate limit headers
        const response = context.switchToHttp().getResponse();
        response.setHeader(
          'X-RateLimit-Allowed',
          allowed,
        );
        response.setHeader('X-RateLimit-Remaining', remaining);
        response.setHeader('X-RateLimit-Reset', Math.ceil(reset / 1000)); // Convert to seconds
        return allowed;
      });

      return result;
  }

  private getClientIp(request: any): string {
    // Check for proxy headers
    const xForwardedFor = request.headers['x-forwarded-for'];
    if (xForwardedFor) {
      return xForwardedFor.split(',')[0].trim();
    }

    // Fall back to connection remote address
    return request.connection.remoteAddress || 'unknown';
  }
}
