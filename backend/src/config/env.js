require('dotenv').config({ quiet: true });

const nodeEnv = process.env.NODE_ENV || 'development';
const isTest = nodeEnv === 'test';

const env = {
  nodeEnv,
  isProduction: nodeEnv === 'production',
  isTest,
  port: Number(process.env.PORT) || 3000,
  frontendUrl: (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, ''),
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    name: isTest ? process.env.DB_NAME_TEST || 'smartqr_test' : process.env.DB_NAME || 'smartqr',
    user: process.env.DB_USER || 'smartqr_user',
    password: process.env.DB_PASSWORD || '',
  },
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS) || (isTest ? 4 : 12),
  rateLimitDisabled: process.env.RATE_LIMIT_DISABLED === 'true' || isTest,
};

// Called once when the server starts. Fails fast if a secret is missing or weak.
env.validate = () => {
  const problems = [];
  if (!env.jwtSecret || env.jwtSecret.length < 32) {
    problems.push('JWT_SECRET must be set and at least 32 characters long.');
  }
  if (env.isProduction && env.jwtSecret.startsWith('change_me')) {
    problems.push('JWT_SECRET still has the example value.');
  }
  if (env.isProduction && !env.frontendUrl.startsWith('https://')) {
    problems.push('FRONTEND_URL must use https in production.');
  }
  if (problems.length) {
    throw new Error(`Invalid environment:\n- ${problems.join('\n- ')}`);
  }
};

module.exports = env;
