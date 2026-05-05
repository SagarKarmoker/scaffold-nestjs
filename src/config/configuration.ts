export default () => ({
  ENVIRONMENT: process.env.ENVIRONMENT || 'development',
  PORT: Number.parseInt(process.env.PORT || '8080', 10),
  SERVER_URL: process.env.SERVER_URL || 'http://localhost',
  DB_TYPE: process.env.DB_TYPE || 'postgres',
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: Number.parseInt(process.env.DB_PORT || '5432', 10),
  DB_USERNAME: process.env.DB_USERNAME || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD || 'password',
  DB_NAME: process.env.DB_NAME || 'scaffold_nest',
  DB_PATH: process.env.DB_PATH || './app.db', // For SQLite
});