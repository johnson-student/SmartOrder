const http = require('http');
const env = require('./config/env');
const app = require('./app');
const { sequelize } = require('./models');
const { initSockets } = require('./sockets');

env.validate();

const server = http.createServer(app);
initSockets(server);

async function start() {
  await sequelize.authenticate(); // fail early if the database is unreachable
  server.listen(env.port, () => {
    console.log(`SmartQR API running on http://localhost:${env.port} (${env.nodeEnv})`);
  });
}

function shutdown(signal) {
  console.log(`${signal} received: shutting down`);
  server.close(async () => {
    await sequelize.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

start().catch((err) => {
  console.error('Failed to start:', err.message);
  process.exit(1);
});
