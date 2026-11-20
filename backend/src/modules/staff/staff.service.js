const bcrypt = require('bcrypt');
const env = require('../../config/env');
const { sequelize, User, RestaurantMember } = require('../../models');
const { notFound, forbidden, conflict } = require('../../utils/AppError');
const { disconnectUser } = require('../../sockets/emitters');

const dto = (m) => ({
  member_id: m.member_id,
  user_id: m.user_id,
  full_name: m.user.full_name,
  email: m.user.email,
  role: m.role,
  is_active: !!m.is_active,
  joined_at: m.joined_at,
});

async function list(restaurantId) {
  const members = await RestaurantMember.findAll({
    where: { restaurant_id: restaurantId },
    include: [{ model: User, as: 'user', required: true }],
    order: [['member_id', 'ASC']],
  });
  return members.map(dto);
}

// Owner can add Manager or Staff. Manager can add Staff only.
async function create(actor, { full_name, email, password, role }) {
  if (actor.role === 'MANAGER' && role !== 'STAFF') {
    throw forbidden('Managers can only add Staff accounts.');
  }
  if (await User.findOne({ where: { email } })) {
    throw conflict('An account with this email already exists.', 'EMAIL_TAKEN');
  }
  const password_hash = await bcrypt.hash(password, env.bcryptRounds);

  const memberId = await sequelize
    .transaction(async (t) => {
      const user = await User.create({ full_name, email, password_hash }, { transaction: t });
      const member = await RestaurantMember.create(
        { restaurant_id: actor.restaurant_id, user_id: user.user_id, role },
        { transaction: t },
      );
      return member.member_id;
    })
    .catch((err) => {
      if (err.name === 'SequelizeUniqueConstraintError') {
        throw conflict('An account with this email already exists.', 'EMAIL_TAKEN');
      }
      throw err;
    });

  const member = await RestaurantMember.findByPk(memberId, {
    include: [{ model: User, as: 'user' }],
  });
  return dto(member);
}

async function update(actor, memberId, { role, is_active }) {
  // restaurant_id in the WHERE clause = tenant isolation: other restaurants' members are invisible.
  const member = await RestaurantMember.findOne({
    where: { member_id: memberId, restaurant_id: actor.restaurant_id },
    include: [{ model: User, as: 'user', required: true }],
  });
  if (!member) throw notFound('Staff member not found.');
  if (member.member_id === actor.member_id) {
    throw forbidden('You cannot change your own account here.');
  }
  if (member.role === 'OWNER') throw forbidden('The Owner account cannot be changed.');
  if (actor.role === 'MANAGER' && (member.role !== 'STAFF' || (role && role !== 'STAFF'))) {
    throw forbidden('Managers can only manage Staff accounts.');
  }

  const changes = {};
  if (role !== undefined) changes.role = role;
  if (is_active !== undefined) changes.is_active = is_active;
  await member.update(changes);

  // Deactivated people lose live connections immediately (API calls already re-check the database).
  if (is_active === false) disconnectUser(member.user_id);
  return dto(member);
}

module.exports = { list, create, update };
