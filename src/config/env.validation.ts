import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  ENVIRONMENT: Joi.string()
    .valid('dev', 'development', 'prod', 'production', 'test')
    .default('dev'),
  PORT: Joi.number().port().default(8080),
  SERVER_URL: Joi.string().uri().default('http://localhost'),
  CLUSTERING: Joi.boolean().default(false),
  CORS_ORIGIN: Joi.string().default(''),
  CORS_ORIGINS: Joi.string().default(''),

  // Database
  DATABASE_URL: Joi.string().default(
    'postgresql://postgres:password@localhost:5432/scaffold_nest',
  ),
  DATABASE_REPLICA_URL: Joi.string().default(''),
  DB_PATH: Joi.string().default('./app.db'),

  // JWT
  JWT_SECRET: Joi.string().default(
    'your-super-secret-jwt-key-change-in-production',
  ),
  JWT_EXPIRATION: Joi.string().default('1d'),
  JWT_REFRESH_SECRET: Joi.string().default(
    'your-super-secret-refresh-token-key-change-in-production',
  ),
  JWT_REFRESH_EXPIRATION: Joi.string().default('7d'),

  // Mail
  MAIL_HOST: Joi.string().default('smtp.example.com'),
  MAIL_PORT: Joi.number().port().default(587),
  SMTP_USER: Joi.string().default(''),
  SMTP_PASSWORD: Joi.string().default(''),

  // Redis
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().port().default(6379),
  REDIS_PASSWORD: Joi.string().default(''),

  // Throttler
  THROTTLE_TTL: Joi.number().default(60000),
  THROTTLE_LIMIT: Joi.number().default(100),
});
