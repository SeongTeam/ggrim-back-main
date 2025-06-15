import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name);
  private readonly store: Map<string, RateLimitEntry> = new Map();
  private ttl: number;
  private limit: number;
  private readonly enabled: boolean;

  getLimit(): number {
    return this.limit;
  }

  constructor(private configService: ConfigService) {
    this.enabled = this.configService.get<string>('ENABLE_RATE_LIMIT', 'true') === 'true';

    const ttlSeconds = parseInt(this.configService.get<string>('RATE_LIMIT_TTL', '60'));
    this.ttl = ttlSeconds * 1000;

    this.limit = parseInt(this.configService.get<string>('RATE_LIMIT_COUNT', '100'));

    setInterval(() => this.cleanup(), this.ttl).unref();
  }

  private getKey(ip: string, path: string): string {
    return `${ip}:${path}`;
  }

  // Check rate limit with custom options
  async checkRateLimitWithOptions(
    ip: string,
    path: string,
    options: { ttl?: number; limit?: number },
  ): Promise<{ allowed: boolean; remaining: number; reset: number }> {
    const originalTtl = this.ttl;
    const originalLimit = this.limit;

    try {
      // Temporarily override the defaults with custom values
      if (options.ttl) this.ttl = options.ttl;
      if (options.limit) this.limit = options.limit;

      return this.checkRateLimit(ip, path);
    } finally {
      this.ttl = originalTtl;
      this.limit = originalLimit;
    }
  }

  // Check rate limit with default options
  async checkRateLimit(
    ip: string,
    path: string,
  ): Promise<{ allowed: boolean; remaining: number; reset: number }> {
    if (!this.enabled) {
      return { allowed: true, remaining: Number.MAX_SAFE_INTEGER, reset: 0 };
    }

    const now = Date.now();
    const key = this.getKey(ip, path);
    let entry = this.store.get(key);
    const requestId = Math.random().toString(36).substring(2, 9);

    if (!entry || entry.resetTime <= now) {
      // Create or reset the entry
      entry = {
        count: 1,
        resetTime: now + this.ttl,
      };
      this.store.set(key, entry);
    } else {
      entry.count += 1;
      this.store.set(key, entry);
    }

    const remaining = Math.max(0, this.limit - entry.count);
    const allowed = entry.count <= this.limit;

    return {
      allowed,
      remaining,
      reset: entry.resetTime,
    };
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetTime <= now) {
        this.store.delete(key);
      }
    }
  }
}
