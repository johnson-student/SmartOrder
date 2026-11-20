const { RestaurantMember, Restaurant, User } = require('../../models');

// Finds the user's active membership (MVP: one restaurant per user).
// Returns null if the user, the membership or the restaurant is not active.
async function loadAuthContext(userId) {
  const member = await RestaurantMember.findOne({
    where: { user_id: userId, is_active: true },
    include: [
      { model: Restaurant, as: 'restaurant', required: true, where: { status: 'ACTIVE' } },
      { model: User, as: 'user', required: true },
    ],
    order: [['member_id', 'ASC']],
  });
  if (!member) return null;
  return {
    user: {
      user_id: member.user.user_id,
      full_name: member.user.full_name,
      email: member.user.email,
    },
    member_id: member.member_id,
    restaurant_id: member.restaurant_id,
    role: member.role,
    restaurant: {
      restaurant_id: member.restaurant.restaurant_id,
      name: member.restaurant.name,
      currency: member.restaurant.currency,
      timezone: member.restaurant.timezone,
    },
  };
}

module.exports = { loadAuthContext };
