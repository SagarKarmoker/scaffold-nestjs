import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from 'src/app.controller';
import { AppService } from 'src/app.service';
import { CacheInterceptor } from '@nestjs/cache-manager';

describe('AppController', () => {
  let controller: AppController;
  let appService: jest.Mocked<AppService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: {
            getHello: jest.fn().mockReturnValue('Hello World!'),
          },
        },
      ],
    })
      .overrideInterceptor(CacheInterceptor)
      .useValue({})
      .compile();

    controller = module.get<AppController>(AppController);
    appService = module.get(AppService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getHello', () => {
    it('should return hello message', () => {
      const result = controller.getHello();
      expect(result).toBe('Hello World!');
      expect(appService.getHello).toHaveBeenCalled();
    });
  });

  describe('getAll', () => {
    it('should return array of items', async () => {
      const result = await controller.getAll();
      expect(result).toEqual([{ id: 1, name: 'Nest' }]);
    });

    it('should simulate delay', async () => {
      const start = Date.now();
      await controller.getAll();
      const duration = Date.now() - start;
      expect(duration).toBeGreaterThanOrEqual(2900);
    });
  });
});
