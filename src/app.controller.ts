import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { AppService } from './app.service';
import { CacheInterceptor } from '@nestjs/cache-manager';

@Controller()
@UseInterceptors(CacheInterceptor)
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // TODO: caching in service endpoint is recommended
  @Get('/getall')
  async getAll() {
    // For demonstration purposes, we will simulate a delay
    // to show that the cache is working as expected.
    await new Promise((resolve) => setTimeout(resolve, 3000));
    return [{ id: 1, name: 'Nest' }];
  }
}
