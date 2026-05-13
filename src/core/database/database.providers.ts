import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

export const databaseProviders = [
  {
    provide: 'DATA_SOURCE',
    inject: [ConfigService],
    useFactory: async (configService: ConfigService) => {
      const dbType = configService.get<'mysql' | 'postgres' | 'sqlite'>(
        'DB_TYPE',
      )!;

      const dataSource =
        dbType === 'sqlite'
          ? new DataSource({
              type: dbType,
              database: configService.get<string>('DB_PATH', 'database.sqlite'),
              entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
              synchronize:
                configService.get<string>('ENVIRONMENT') === 'development',
            })
          : new DataSource({
              type: dbType,
              host: configService.get<string>('DB_HOST')!,
              port: configService.get<number>('DB_PORT')!,
              username: configService.get<string>('DB_USERNAME')!,
              password: configService.get<string>('DB_PASSWORD')!,
              database: configService.get<string>('DB_NAME')!,
              entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
              synchronize: false,
              migrations: [__dirname + '/../../migrations/*{.ts,.js}'],
              migrationsRun: false,
              extra : { // connection pooling options
                connectionLimit: configService.get<number>('DB_CONNECTION_LIMIT', 10),
              }
            });

      return dataSource.initialize();
    },
  },
];
