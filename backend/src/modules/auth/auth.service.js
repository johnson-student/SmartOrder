const bcrypt = require('bcrypt');
const env = require('../../config/env');
const { sequelize, User, Restaurant, RestaurantMember } = require('../../models');
const { unauthorized, conflict } = require('../../utils/AppError');
const { signToken } = require('./auth.tokens');
const { loadAuthContext } = require('./auth.context');

// Compared when the email does not exist, so "unknown email" and "wrong password" take equal time.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', env.bcryptRounds);

const profile = (ctx) => ({
  user: ctx.user,
  role: ctx.role,
  restaurant: ctx.restaurant,
});

async function register({ full_name, email, password, restaurant_name, currency, timezone }) {
  if (await User.findOne({ where: { email } })) {
    throw conflict('An account with this email already exists.', 'EMAIL_TAKEN');
  }
  const password_hash = await bcrypt.hash(password, env.bcryptRounds);

  let userId;
  try {
    userId = await sequelize.transaction(async (t) => {
      const restaurant = await Restaurant.create(
        { name: restaurant_name, currency, timezone },
        { transaction: t },
      );
      const user = await User.create({ full_name, email, password_hash }, { transaction: t });
      await RestaurantMember.create(
        { restaurant_id: restaurant.restaurant_id, user_id: user.user_id, role: 'OWNER' },
        { transaction: t },
      );
      return user.user_id;
    });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      throw conflict('An account with this email already exists.', 'EMAIL_TAKEN');
    }
    throw err;
  }

  const ctx = await loadAuthContext(userId);
  return { token: signToken(userId), ...profile(ctx) };
}

async function login({ email, password }) {
  const user = await User.scope('withPassword').findOne({ where: { email } });
  const matches = await bcrypt.compare(password, user ? user.password_hash : DUMMY_HASH);
  // Same message for every failure: we never reveal which part was wrong.
  const fail = () => unauthorized('Email or password is incorrect.', 'INVALID_CREDENTIALS');
  if (!user || !matches) throw fail();

  const ctx = await loadAuthContext(user.user_id);
  if (!ctx) throw fail(); // deactivated members cannot sign in

  return { token: signToken(user.user_id), ...profile(ctx) };
}

module.exports = { register, login, profile };
