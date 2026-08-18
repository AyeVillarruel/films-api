process.env.NODE_ENV = 'test';
process.env.DB_PATH = ':memory:';
process.env.JWT_SECRET = 'e2e-test-secret-key-with-32-chars-minimum';
process.env.ADMIN_EMAIL = 'admin-e2e@test.com';
process.env.ADMIN_PASSWORD = 'admin123';
process.env.ADMIN_NAME = 'Admin E2E';
