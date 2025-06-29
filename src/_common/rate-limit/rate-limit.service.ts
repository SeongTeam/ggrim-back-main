import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../../Logger/logger.service';
import { RATE_LIMIT_DEFAULT_COUNT, RATE_LIMIT_DEFAULT_TTL_MS, RATE_LIMIT_ENABLED } from '../const/env-keys.const';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

@Injectable()
export class RateLimitService {
  private readonly store: Map<string, RateLimitEntry> = new Map();
  private readonly CLEAN_UP_INTERVAL_MS : number  = 60*1000;
  private readonly ENABLED: boolean;
  private readonly DEFAULT_TTL_MS: number;
  private readonly  DEFAULT_LIMIT: number;


  constructor(@Inject() private configService: ConfigService, @Inject(forwardRef(() => LoggerService)) private readonly logger: LoggerService ) {
    this.ENABLED = this.configService.get<string>(RATE_LIMIT_ENABLED, 'true') === 'true';

    this.DEFAULT_TTL_MS =parseInt(this.configService.get<string>(RATE_LIMIT_DEFAULT_TTL_MS, '60000'));
    this.DEFAULT_LIMIT = parseInt(this.configService.get<string>(RATE_LIMIT_DEFAULT_COUNT, '100'));
    
    setInterval(() => this.cleanup(), this.CLEAN_UP_INTERVAL_MS).unref();
  }

  private getKey(ip: string, path: string): string {
    return `${ip}:${path}`;
  }

  // Check rate limit with custom options
  async checkRateLimit(
    ip: string,
    path: string,
    options: { ttl?: number; limit?: number },
  ): Promise<{ allowed: boolean; remaining: number; reset: number }> {

    if (!this.ENABLED) {
      return { allowed: true, remaining: Number.MAX_SAFE_INTEGER, reset: 0 };
    }

    let ttl = this.DEFAULT_TTL_MS;
    let limit = this.DEFAULT_LIMIT;


    // Temporarily override the defaults with custom values
    if (options.ttl) ttl = options.ttl;
    if (options.limit) limit = options.limit;

    return this.recordRequest(ip, path,ttl,limit);
    
  }

  // find rate limit info 
  private async recordRequest(
    ip: string,
    path: string,
    ttl : number,
    limit : number,
  ): Promise<{ allowed: boolean; remaining: number; reset: number }> {
    const now = Date.now();
    const key = this.getKey(ip, path);
    let entry = this.store.get(key);

    if (!entry || entry.resetTime <= now) {
      // Create or reset the entry
      entry = {
        count: 1,
        resetTime: now + ttl,
      };
      this.store.set(key, entry);
    } else {
      entry.count += 1;
      this.store.set(key, entry);
    }

    const remaining = Math.max(0, limit - entry.count);
    const allowed = entry.count <= limit;

    return {
      allowed,
      remaining,
      reset: entry.resetTime,
    };
  }

  private cleanup(): void {
    const now = Date.now();
    this.logger.log(`Start clean up. before : ${this.store.size}`,{className : 'RateLimitService' });
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetTime <= now) {
        this.store.delete(key);
      }
    }

    this.logger.log(`End clean up. after : ${this.store.size}`,{className : 'RateLimitService' });
  }
}
