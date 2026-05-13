import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  HealthCheckService,
  TypeOrmHealthIndicator,
  HealthCheck,
} from '@nestjs/terminus';
import { RedisHealthIndicator } from './redis.health.indicator';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
    private readonly redis: RedisHealthIndicator,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  @HealthCheck()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Detailed health check (authenticated)' })
  @ApiOkResponse({ description: 'All services healthy', schema: { example: { status: 'ok', info: { database: { status: 'up' }, redis: { status: 'up' } } } } })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.redis.isHealthy('redis'),
    ]);
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness / liveness probe (unauthenticated, safe for k8s)' })
  @ApiOkResponse({ description: 'Service is up', schema: { example: { status: 'ok', timestamp: '2024-01-01T00:00:00.000Z' } } })
  ready() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
