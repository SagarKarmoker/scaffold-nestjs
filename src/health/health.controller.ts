
import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HealthCheckService, HttpHealthIndicator, HealthCheck } from '@nestjs/terminus';

@Controller('health')
export class HealthController {
    constructor(
        private readonly health: HealthCheckService,
        private readonly http: HttpHealthIndicator,
        private readonly configService: ConfigService
    ) { }

    @Get()
    @HealthCheck()
    check() {
        const SERVER_URL = this.configService.get<string>('SERVER_URL');
        return this.health.check([
            // TODO: will remove this check in production, it's just to demonstrate the use of Terminus and Swagger together.
            // remove the port also if you are not running the server on port 8080
            () => this.http.pingCheck('api-docs', `${SERVER_URL}:8080/v1/docs`),
        ]);
    }
}
