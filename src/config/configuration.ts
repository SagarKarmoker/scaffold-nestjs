export default () => ({
  ENVIRONMENT: process.env.ENVIRONMENT || 'development',
  PORT: Number.parseInt(process.env.PORT || '8080', 10),
  SERVER_URL: process.env.SERVER_URL || 'http://localhost',
  CLUSTERING: process.env.CLUSTERING === 'true',

  DATABASE_URL: process.env.DATABASE_URL,
  DATABASE_REPLICA_URL: process.env.DATABASE_REPLICA_URL || '',

  JWT: {
    SECRET: process.env.JWT_SECRET,
    EXPIRATION: process.env.JWT_EXPIRATION || '1d',
    REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    REFRESH_EXPIRATION: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },

  MAIL: {
    HOST: process.env.MAIL_HOST || 'smtp.example.com',
    PORT: Number.parseInt(process.env.MAIL_PORT || '587', 10),
    USER: process.env.SMTP_USER || '',
    PASSWORD: process.env.SMTP_PASSWORD || '',
  },

  REDIS: {
    HOST: process.env.REDIS_HOST || 'localhost',
    PORT: Number.parseInt(process.env.REDIS_PORT || '6379', 10),
    PASSWORD: process.env.REDIS_PASSWORD || '',
  },

  THROTTLE: {
    TTL: Number.parseInt(process.env.THROTTLE_TTL || '60000', 10),
    LIMIT: Number.parseInt(process.env.THROTTLE_LIMIT || '100', 10),
  },
});
