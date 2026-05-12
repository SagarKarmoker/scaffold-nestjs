export default () => ({
  ENVIRONMENT: process.env.ENVIRONMENT || 'development',
  PORT: Number.parseInt(process.env.PORT || '8080', 10),
  SERVER_URL: process.env.SERVER_URL || 'http://localhost',
  CLUSTERING: process.env.CLUSTERING === 'true',

  // Database – PostgreSQL via URL (preferred) or individual params
  DATABASE_URL:
    process.env.DATABASE_URL ||
    'postgresql://postgres:password@localhost:5432/scaffold_nest',
  // DATABASE_REPLICA_URL is used for read-heavy queries (optional)
  DATABASE_REPLICA_URL: process.env.DATABASE_REPLICA_URL || '',
  DB_TYPE: process.env.DB_TYPE || 'postgres',
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: Number.parseInt(process.env.DB_PORT || '5432', 10),
  DB_USERNAME: process.env.DB_USERNAME || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD || 'password',
  DB_NAME: process.env.DB_NAME || 'scaffold_nest',
  DB_PATH: process.env.DB_PATH || './app.db', // SQLite fallback

  JWT: {
    SECRET:
      process.env.JWT_SECRET ||
      'your-super-secret-jwt-key-change-in-production',
    EXPIRATION: process.env.JWT_EXPIRATION || '1d',
    REFRESH_SECRET:
      process.env.JWT_REFRESH_SECRET ||
      'your-super-secret-refresh-token-key-change-in-production',
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
