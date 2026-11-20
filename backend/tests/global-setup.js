const { execSync } = require('child_process');

// Runs once before all tests: rebuild the test database schema from the real migrations.
module.exports = async () => {
  const env = { ...process.env, NODE_ENV: 'test' };
  execSync('npx sequelize-cli db:migrate:undo:all', { env, stdio: 'ignore' });
  execSync('npx sequelize-cli db:migrate', { env, stdio: 'ignore' });
};
