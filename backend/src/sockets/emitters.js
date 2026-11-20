const { getIo } = require('./io');

// Safe to call when Socket.IO is not running (for example in unit tests): it does nothing.
// Services call these ONLY AFTER the database transaction has committed.

function emitOrderCreated(restaurantId, order) {
  const io = getIo();
  if (io) io.to(`restaurant:${restaurantId}`).emit('order:created', order);
}

function emitOrderUpdated(restaurantId, payload) {
  const io = getIo();
  if (io) io.to(`restaurant:${restaurantId}`).emit('order:updated', payload);
}

function emitStatusChanged(publicToken, payload) {
  const io = getIo();
  if (io) io.to(`order:${publicToken}`).emit('order:status_changed', payload);
}

// Used when a staff member is deactivated: closes their live connections.
function disconnectUser(userId) {
  const io = getIo();
  if (io) io.in(`user:${userId}`).disconnectSockets(true);
}

module.exports = { emitOrderCreated, emitOrderUpdated, emitStatusChanged, disconnectUser };
