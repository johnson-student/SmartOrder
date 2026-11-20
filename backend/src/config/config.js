// Used only by sequelize-cli (migrations and seeders).
const env = require('./env');

const base = {
  username: env.db.user,
  password: env.db.password,
  database: env.db.name,
  host: env.db.host,
  port: env.db.port,
  dialect: 'mysql',
  timezone: '+00:00',
  logging: false,
};

module.exports = { development: base, test: base, production: base };
