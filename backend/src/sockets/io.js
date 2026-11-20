// Holds the Socket.IO server so services can emit events without importing the server.
let io = null;

module.exports = {
  setIo(instance) {
    io = instance;
  },
  getIo() {
    return io;
  },
};
