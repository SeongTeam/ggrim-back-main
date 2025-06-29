import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from '../../Logger/logger.module.js';
import { RateLimitGuard } from './rate-limit.guard.js';
import { RateLimitService } from './rate-limit.service.js';

@Global()
@Module({
  imports: [ConfigModule,LoggerModule],
  providers: [
    RateLimitService,
    {
      provide: 'APP_GUARD',
      useClass: RateLimitGuard,
    },
  ],
  exports: [RateLimitService],
})
export class RateLimitModule {}
