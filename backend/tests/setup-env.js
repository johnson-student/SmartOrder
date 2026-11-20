// Runs before every test file. Tests always use the separate test database.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET =
  process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32
    ? process.env.JWT_SECRET
    : 'test-secret-test-secret-test-secret-123456';
process.env.FRONTEND_URL = 'http://localhost:5173';
