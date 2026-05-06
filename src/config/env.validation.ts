import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  ENVIRONMENT: Joi.string()
    .valid('dev', 'development', 'prod', 'production', 'test')
    .default('dev'),
  PORT: Joi.number().port().default(8080),
  SERVER_URL: Joi.string().uri().default('http://localhost'),
  CORS_ORIGINS: Joi.string().default(''),
  DB_PATH: Joi.string().default('./app.db'),
});