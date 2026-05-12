import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import {
  HealthCheckError,
  HealthIndicator,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisHealthIndicator
  extends HealthIndicator
  implements OnModuleDestroy
{
  private readonly logger = new Logger(RedisHealthIndicator.name);
  private readonly redis: Redis;

  constructor(private readonly configService: ConfigService) {
    super();
    this.redis = new Redis({
      host: this.configService.get<string>('REDIS.HOST') ?? 'localhost',
      port: this.configService.get<number>('REDIS.PORT') ?? 6379,
      password: this.configService.get<string>('REDIS.PASSWORD') || undefined,
      connectTimeout: 2000,
      commandTimeout: 2000,
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    });

    this.redis.on('error', (err) => {
      this.logger.warn(`Redis health-check client error: ${err.message}`);
    });
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const result = await this.redis.ping();
      const isHealthy = result === 'PONG';
      return this.getStatus(key, isHealthy, { responseTime: result });
    } catch (error) {
      const err = error as Error;
      throw new HealthCheckError(
        'Redis health check failed',
        this.getStatus(key, false, { error: err.message }),
      );
    }
  }

  onModuleDestroy(): void {
    this.redis.disconnect();
  }
}
