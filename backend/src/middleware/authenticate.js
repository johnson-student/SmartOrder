const asyncHandler = require('../utils/asyncHandler');
const { unauthorized } = require('../utils/AppError');
const { verifyToken } = require('../modules/auth/auth.tokens');
const { loadAuthContext } = require('../modules/auth/auth.context');

// Reads "Authorization: Bearer <jwt>", then loads the user's CURRENT membership from the database.
// The role is never trusted from the token, so deactivating someone takes effect immediately.
module.exports = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) throw unauthorized('Please sign in.');

  const payload = verifyToken(token);
  const ctx = await loadAuthContext(payload.sub);
  if (!ctx) throw unauthorized('Your account is not active.', 'ACCOUNT_INACTIVE');

  req.auth = ctx; // { user, member_id, restaurant_id, role, restaurant }
  next();
});
