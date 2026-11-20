const crypto = require('crypto');

// Secure random token as hex text. randomToken(32) -> 64 characters, randomToken(16) -> 32.
const randomToken = (bytes) => crypto.randomBytes(bytes).toString('hex');

const QR_TOKEN_RE = /^[a-f0-9]{64}$/;
const ORDER_TOKEN_RE = /^[a-f0-9]{32}$/;

module.exports = { randomToken, QR_TOKEN_RE, ORDER_TOKEN_RE };
