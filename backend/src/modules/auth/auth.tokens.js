const jwt = require('jsonwebtoken');
const env = require('../../config/env');
const { unauthorized } = require('../../utils/AppError');

// The token only says WHO the user is ("sub"). Role and restaurant come from the database.
function signToken(userId) {
  return jwt.sign({ sub: userId }, env.jwtSecret, {
    algorithm: 'HS256',
    expiresIn: env.jwtExpiresIn,
  });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw unauthorized('Your session has expired. Please sign in again.', 'TOKEN_EXPIRED');
    }
    throw unauthorized('Invalid token.', 'INVALID_TOKEN');
  }
}

module.exports = { signToken, verifyToken };
