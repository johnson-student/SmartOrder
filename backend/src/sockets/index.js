const { Server } = require('socket.io');
const env = require('../config/env');
const { setIo } = require('./io');
const { verifyToken } = require('../modules/auth/auth.tokens');
const { loadAuthContext } = require('../modules/auth/auth.context');
const { Order } = require('../models');
const { ORDER_TOKEN_RE } = require('../utils/token');

const MAX_ORDER_JOINS_PER_MINUTE = 30;

function initSockets(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: env.frontendUrl, methods: ['GET', 'POST'] },
    maxHttpBufferSize: 10 * 1024,
  });
  setIo(io);

  // Staff send their JWT in the handshake. Customers send nothing (they use an order token later).
  io.use(async (socket, next) => {
    const token = socket.handshake.auth && socket.handshake.auth.token;
    if (!token) return next();
    try {
      const { sub } = verifyToken(token);
      const ctx = await loadAuthContext(sub);
      if (!ctx) return next(new Error('ACCOUNT_INACTIVE'));
      socket.data.auth = ctx;
      next();
    } catch {
      next(new Error('UNAUTHENTICATED'));
    }
  });

  io.on('connection', (socket) => {
    let joins = 0;
    const timer = setInterval(() => (joins = 0), 60 * 1000);
    socket.on('disconnect', () => clearInterval(timer));

    if (socket.data.auth) socket.join(`user:${socket.data.auth.user.user_id}`);

    // Staff: join their restaurant's room. The restaurant comes from the database, never from the client.
    socket.on('join:restaurant', async (_payload, ack) => {
      const reply = typeof ack === 'function' ? ack : () => {};
      try {
        if (!socket.data.auth) return reply({ ok: false, error: 'UNAUTHENTICATED' });
        const ctx = await loadAuthContext(socket.data.auth.user.user_id);
        if (!ctx) {
          reply({ ok: false, error: 'ACCOUNT_INACTIVE' });
          return socket.disconnect(true);
        }
        socket.join(`restaurant:${ctx.restaurant_id}`);
        reply({ ok: true });
      } catch {
        reply({ ok: false, error: 'INTERNAL_ERROR' });
      }
    });

    // Customer: join the private room of ONE order. Needs the secret order token.
    socket.on('join:order', async (payload, ack) => {
      const reply = typeof ack === 'function' ? ack : () => {};
      try {
        if (++joins > MAX_ORDER_JOINS_PER_MINUTE)
          return reply({ ok: false, error: 'RATE_LIMITED' });
        const token = payload && payload.token;
        if (typeof token !== 'string' || !ORDER_TOKEN_RE.test(token)) {
          return reply({ ok: false, error: 'INVALID_TOKEN' });
        }
        const order = await Order.findOne({
          attributes: ['order_id'],
          where: { public_token: token },
        });
        if (!order) return reply({ ok: false, error: 'INVALID_TOKEN' });
        socket.join(`order:${token}`);
        reply({ ok: true });
      } catch {
        reply({ ok: false, error: 'INTERNAL_ERROR' });
      }
    });
  });

  return io;
}

module.exports = { initSockets };
