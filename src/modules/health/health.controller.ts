import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  HealthCheckService,
  TypeOrmHealthIndicator,
  HealthCheck,
} from '@nestjs/terminus';
import { RedisHealthIndicator } from './redis.health.indicator';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
    private readonly redis: RedisHealthIndicator,
  ) {}

  // Protected: requires a valid JWT. Do NOT use this for k8s probes.
  // Use /health/ready for liveness and readiness probes instead.
  @UseGuards(JwtAuthGuard)
  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Detailed health check (authenticated)' })
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.redis.isHealthy('redis'),
    ]);
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness / liveness probe (unauthenticated, safe for k8s)' })
  ready() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
