import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  ENVIRONMENT: Joi.string()
    .valid('dev', 'development', 'prod', 'production', 'test')
    .default('dev'),
  PORT: Joi.number().port().default(8080),
  SERVER_URL: Joi.string().uri().default('http://localhost'),
  CORS_ORIGINS: Joi.string().default(''),
  DB_PATH: Joi.string().default('./app.db'),
  JWT_SECRET: Joi.string().default(
    'your-super-secret-jwt-key-change-in-production',
  ),
  JWT_EXPIRATION: Joi.string().default('1d'),
  JWT_REFRESH_SECRET: Joi.string().default(
    'your-super-secret-refresh-token-key-change-in-production',
  ),
  JWT_REFRESH_EXPIRATION: Joi.string().default('7d'),
  CLERK_PUBLISHABLE_KEY: Joi.string().default(''),
  CLERK_SECRET_KEY: Joi.string().default(''),
});
