process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.JWT_SECRET =
  process.env.JWT_SECRET || 'unit-test-secret-key-with-32-chars-min';
