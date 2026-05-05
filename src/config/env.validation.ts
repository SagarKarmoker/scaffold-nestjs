import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  ENVIRONMENT: Joi.string()
    .valid('dev', 'development', 'prod', 'production', 'test')
    .default('dev'),
  PORT: Joi.number().port().default(8080),
  SERVER_URL: Joi.string().uri().default('http://localhost'),
  CORS_ORIGINS: Joi.string().default(''),
  DB_TYPE: Joi.string().valid('postgres', 'mysql', 'sqlite', 'mariadb', 'mongodb').default('postgres'),
  DB_HOST: Joi.string().hostname().default('localhost'),
  DB_PORT: Joi.number().port().default(5432),
  DB_USERNAME: Joi.string().default('postgres'),
  DB_PASSWORD: Joi.string().default('password'),
  DB_NAME: Joi.string().default('scaffold_nest'),
  DB_PATH: Joi.string().default('./app.db'),
});