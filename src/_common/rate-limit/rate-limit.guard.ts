import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RATE_LIMIT_METADATA } from '../const/env-keys.const';
import { ServiceException } from '../filter/exception/service/service-exception';
import { RateLimitService } from './rate-limit.service.js';

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

      if(!result){
        throw new ServiceException('BASE','TOO_MANY_REQUESTS','exceed rate limit');
      }

      return result;
  }

  private getClientIp(request: any): string {
    // Check for proxy headers
    const xForwardedFor = request.headers['x-forwarded-for'];
    if (!xForwardedFor) {
     throw new ServiceException('BASE','BAD_REQUEST',`request header[x-forwarded-for] field is undefined `);
    }

    // Fall back to connection remote address
    return xForwardedFor.split(',')[0].trim();
  }
}
