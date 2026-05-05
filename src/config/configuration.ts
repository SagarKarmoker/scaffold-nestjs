export default () => ({
  ENVIRONMENT: process.env.ENVIRONMENT || 'development',
  PORT: Number.parseInt(process.env.PORT || '8080', 10),
  SERVER_URL: process.env.SERVER_URL || 'http://localhost',
});