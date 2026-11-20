const { Op } = require('sequelize');
const {
  sequelize,
  Restaurant,
  DiningTable,
  Order,
  OrderItem,
  OrderStatusHistory,
  User,
} = require('../../models');
const { notFound, conflict } = require('../../utils/AppError');
const { rangeUtc } = require('../../utils/dates');
const { emitOrderUpdated, emitStatusChanged } = require('../../sockets/emitters');
const { ACTIVE_STATUSES, canTransition } = require('./order.constants');
const { serializeOrder } = require('./order.serializer');

const tableInclude = { model: DiningTable, as: 'table', attributes: ['table_id', 'table_number'] };

async function list(restaurantId, query) {
  const where = { restaurant_id: restaurantId };
  if (query.status) where.status = { [Op.in]: query.status };
  else if (query.active) where.status = { [Op.in]: ACTIVE_STATUSES };

  if (query.from || query.to) {
    const restaurant = await Restaurant.findByPk(restaurantId, { attributes: ['timezone'] });
    const from = query.from || query.to;
    const to = query.to || query.from;
    const [start, end] = rangeUtc(from, to, restaurant.timezone);
    where.created_at = { [Op.gte]: start, [Op.lt]: end };
  }

  const dir = query.sort.toUpperCase();
  const { rows, count } = await Order.findAndCountAll({
    where,
    include: [tableInclude, { model: OrderItem, as: 'items' }],
    order: [
      ['created_at', dir],
      ['order_id', dir],
    ],
    limit: query.limit,
    offset: (query.page - 1) * query.limit,
    distinct: true,
  });

  return {
    orders: rows.map((o) => serializeOrder(o)),
    meta: {
      page: query.page,
      limit: query.limit,
      total: count,
      total_pages: Math.max(1, Math.ceil(count / query.limit)),
    },
  };
}

async function get(restaurantId, orderId) {
  const order = await Order.findOne({
    where: { order_id: orderId, restaurant_id: restaurantId }, // other restaurants' orders -> 404
    include: [
      tableInclude,
      { model: OrderItem, as: 'items' },
      {
        model: OrderStatusHistory,
        as: 'history',
        include: [{ model: User, as: 'changed_by_user', attributes: ['full_name'] }],
      },
    ],
  });
  if (!order) throw notFound('Order not found.', 'ORDER_NOT_FOUND');
  return serializeOrder(order, { withHistory: true });
}

async function updateStatus(actor, orderId, { status, reason }) {
  const { order, oldStatus, changedAt } = await sequelize.transaction(async (t) => {
    // Lock the order row: two staff members cannot change the same order at the same moment.
    const order = await Order.findOne({
      where: { order_id: orderId, restaurant_id: actor.restaurant_id },
      lock: t.LOCK.UPDATE,
      transaction: t,
    });
    if (!order) throw notFound('Order not found.', 'ORDER_NOT_FOUND');

    if (!canTransition(order.status, status)) {
      throw conflict(
        `An order that is ${order.status} cannot be changed to ${status}.`,
        'INVALID_TRANSITION',
      );
    }
    const oldStatus = order.status;
    const changedAt = new Date();
    await order.update({ status }, { transaction: t });
    await OrderStatusHistory.create(
      {
        order_id: order.order_id,
        changed_by: actor.user.user_id,
        old_status: oldStatus,
        new_status: status,
        reason: reason || null,
        changed_at: changedAt,
      },
      { transaction: t },
    );
    return { order, oldStatus, changedAt };
  });

  // After commit: tell other staff screens and the customer's private room.
  emitOrderUpdated(actor.restaurant_id, {
    order_id: order.order_id,
    order_number: order.order_number,
    old_status: oldStatus,
    status,
  });
  emitStatusChanged(order.public_token, { status, changed_at: changedAt });

  return get(actor.restaurant_id, order.order_id);
}

module.exports = { list, get, updateStatus };
