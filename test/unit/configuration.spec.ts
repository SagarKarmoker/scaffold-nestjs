import configuration from './configuration';

describe('Configuration', () => {
  it('should return default configuration', () => {
    const config = configuration();
    
    expect(config.ENVIRONMENT).toBe('development');
    expect(config.PORT).toBe(8080);
    expect(config.SERVER_URL).toBe('http://localhost');
    expect(config.DB_PATH).toBe('./app.db');
  });

  it('should have JWT configuration', () => {
    const config = configuration();
    
    expect(config.JWT).toBeDefined();
    expect(config.JWT.SECRET).toBeDefined();
    expect(config.JWT.EXPIRATION).toBe('1d');
  });

  it('should use environment variables when provided', () => {
    process.env.PORT = '3000';
    process.env.ENVIRONMENT = 'production';
    process.env.JWT_SECRET = 'test-secret';
    
    const config = configuration();
    
    expect(config.PORT).toBe(3000);
    expect(config.ENVIRONMENT).toBe('production');
    expect(config.JWT.SECRET).toBe('test-secret');
    
    delete process.env.PORT;
    delete process.env.ENVIRONMENT;
    delete process.env.JWT_SECRET;
  });
});