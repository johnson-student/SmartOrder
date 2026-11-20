const { Sequelize } = require('sequelize');
const env = require('./env');

const sequelize = new Sequelize(env.db.name, env.db.user, env.db.password, {
  host: env.db.host,
  port: env.db.port,
  dialect: 'mysql',
  timezone: '+00:00', // all DATETIME values are stored in UTC
  logging: false,
  define: { timestamps: false, freezeTableName: true },
  pool: { max: 10, min: 0, idle: 10000, acquire: 30000 },
});

module.exports = sequelize;
