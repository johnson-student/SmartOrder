const { Restaurant } = require('../../models');
const { notFound } = require('../../utils/AppError');

const dto = (r) => ({
  restaurant_id: r.restaurant_id,
  name: r.name,
  address: r.address,
  phone: r.phone,
  currency: r.currency,
  timezone: r.timezone,
  status: r.status,
  created_at: r.created_at,
});

async function get(restaurantId) {
  const r = await Restaurant.findByPk(restaurantId);
  if (!r) throw notFound('Restaurant not found.');
  return dto(r);
}

async function update(restaurantId, values) {
  const r = await Restaurant.findByPk(restaurantId);
  if (!r) throw notFound('Restaurant not found.');
  await r.update(values);
  return dto(r);
}

module.exports = { get, update };
