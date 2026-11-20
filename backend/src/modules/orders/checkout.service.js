const {
  sequelize,
  Restaurant,
  DiningTable,
  QrCode,
  Category,
  MenuItem,
  Order,
  OrderItem,
  OrderStatusHistory,
} = require('../../models');
const { notFound, unprocessable } = require('../../utils/AppError');
const { randomToken, QR_TOKEN_RE, ORDER_TOKEN_RE } = require('../../utils/token');
const { parseCents, formatCents } = require('../../utils/money');
const { emitOrderCreated } = require('../../sockets/emitters');
const { serializeOrder, historyDto } = require('./order.serializer');

const QR_INVALID = () =>
  notFound('This QR code is not valid anymore. Please ask the staff for help.', 'QR_INVALID');

// Finds the table + restaurant behind a QR token. Fails for unknown, revoked or inactive codes.
async function resolveQr(token) {
  if (typeof token !== 'string' || !QR_TOKEN_RE.test(token)) throw QR_INVALID();
  const qr = await QrCode.findOne({
    where: { code_value: token, is_active: true },
    include: [
      {
        model: DiningTable,
        as: 'table',
        required: true,
        where: { is_active: true },
        include: [
          { model: Restaurant, as: 'restaurant', required: true, where: { status: 'ACTIVE' } },
        ],
      },
    ],
  });
  if (!qr) throw QR_INVALID();
  return { table: qr.table, restaurant: qr.table.restaurant };
}

async function getPublicMenu(token) {
  const { table, restaurant } = await resolveQr(token);
  const categories = await Category.findAll({
    where: { restaurant_id: restaurant.restaurant_id, is_active: true },
    include: [
      {
        model: MenuItem,
        as: 'items',
        required: false,
        where: { is_active: true, is_available: true },
      },
    ],
    order: [
      ['sort_order', 'ASC'],
      ['category_id', 'ASC'],
      [{ model: MenuItem, as: 'items' }, 'name', 'ASC'],
    ],
  });
  return {
    restaurant: { name: restaurant.name, currency: restaurant.currency },
    table: { table_number: table.table_number },
    categories: categories
      .filter((c) => c.items.length > 0)
      .map((c) => ({
        category_id: c.category_id,
        name: c.name,
        items: c.items.map((i) => ({
          item_id: i.item_id,
          name: i.name,
          description: i.description,
          image_url: i.image_url,
          price: i.price,
        })),
      })),
  };
}

// Creates an order. The client only sends item ids + quantities. Everything else is derived here:
// restaurant and table (from the QR), prices and totals (from the database), numbers (from a counter).
async function createOrder({ qr_token, client_request_id, customer_note, items }) {
  const { table, restaurant } = await resolveQr(qr_token);
  const restaurantId = restaurant.restaurant_id;

  const { order, created } = await sequelize.transaction(async (t) => {
    // 1. Lock the restaurant row: orders of one restaurant are numbered one at a time.
    const locked = await Restaurant.findByPk(restaurantId, { lock: t.LOCK.UPDATE, transaction: t });

    // 2. The same client_request_id twice = a double click. Return the first order again.
    const existing = await Order.findOne({
      where: { restaurant_id: restaurantId, client_request_id },
      transaction: t,
    });
    if (existing) return { order: existing, created: false };

    // 3. Re-check the table inside the transaction.
    const stillActive = await DiningTable.findOne({
      where: { table_id: table.table_id, restaurant_id: restaurantId, is_active: true },
      transaction: t,
    });
    if (!stillActive) throw QR_INVALID();

    // 4. Load current prices. Only active + available items of THIS restaurant are accepted.
    const ids = [...new Set(items.map((i) => i.item_id))];
    const menuItems = await MenuItem.findAll({
      where: { item_id: ids, is_active: true, is_available: true },
      include: [
        {
          model: Category,
          as: 'category',
          required: true,
          attributes: [],
          where: { restaurant_id: restaurantId, is_active: true },
        },
      ],
      transaction: t,
    });
    const byId = new Map(menuItems.map((m) => [m.item_id, m]));
    const missing = ids.filter((id) => !byId.has(id));
    if (missing.length) {
      throw unprocessable(
        'Some items are not available anymore. Please update your cart.',
        'ITEM_UNAVAILABLE',
        { item_ids: missing },
      );
    }

    // 5. Maths in whole cents.
    let subtotalCents = 0;
    const lines = items.map((line) => {
      const menuItem = byId.get(line.item_id);
      const unit = parseCents(menuItem.price);
      const lineCents = unit * line.quantity;
      subtotalCents += lineCents;
      return {
        item_id: menuItem.item_id,
        item_name_snapshot: menuItem.name, // snapshot: later menu edits never change this order
        quantity: line.quantity,
        unit_price: formatCents(unit),
        line_total: formatCents(lineCents),
        notes: line.notes || null,
      };
    });

    // 6. Take the next order number, then save order, items and the first history row.
    const orderNumber = locked.next_order_number;
    await locked.update({ next_order_number: orderNumber + 1 }, { transaction: t });

    const order = await Order.create(
      {
        restaurant_id: restaurantId,
        table_id: table.table_id,
        order_number: orderNumber,
        public_token: randomToken(16),
        client_request_id,
        status: 'PENDING',
        subtotal: formatCents(subtotalCents),
        total: formatCents(subtotalCents), // no tax or fees in the MVP
        customer_note: customer_note || null,
      },
      { transaction: t },
    );
    await OrderItem.bulkCreate(
      lines.map((l) => ({ ...l, order_id: order.order_id })),
      { transaction: t },
    );
    await OrderStatusHistory.create(
      { order_id: order.order_id, changed_by: null, old_status: null, new_status: 'PENDING' },
      { transaction: t },
    );
    return { order, created: true };
  });

  // The transaction has committed: now it is safe to tell the staff.
  if (created) {
    const full = await Order.findByPk(order.order_id, {
      include: [
        { model: DiningTable, as: 'table', attributes: ['table_id', 'table_number'] },
        { model: OrderItem, as: 'items' },
      ],
    });
    emitOrderCreated(restaurantId, serializeOrder(full));
  }

  return {
    created,
    order: {
      order_number: order.order_number,
      public_token: order.public_token,
      status: order.status,
      total: order.total,
    },
  };
}

// Customer view of ONE order, found by its secret token.
async function getTrackedOrder(token) {
  if (typeof token !== 'string' || !ORDER_TOKEN_RE.test(token)) {
    throw notFound('Order not found.', 'ORDER_NOT_FOUND');
  }
  const order = await Order.findOne({
    where: { public_token: token },
    include: [
      { model: DiningTable, as: 'table', attributes: ['table_id', 'table_number'] },
      { model: Restaurant, as: 'restaurant', attributes: ['name', 'currency'] },
      { model: OrderItem, as: 'items' },
      { model: OrderStatusHistory, as: 'history' },
    ],
  });
  if (!order) throw notFound('Order not found.', 'ORDER_NOT_FOUND');

  const full = serializeOrder(order);
  return {
    order_number: full.order_number,
    status: full.status,
    table_number: order.table.table_number,
    restaurant: { name: order.restaurant.name, currency: order.restaurant.currency },
    items: full.items.map(({ name, quantity, unit_price, line_total, notes }) => ({
      name,
      quantity,
      unit_price,
      line_total,
      notes,
    })),
    total: full.total,
    customer_note: full.customer_note,
    created_at: full.created_at,
    updated_at: full.updated_at,
    // Staff names and internal reasons are not shown to customers.
    history: order.history
      .slice()
      .sort((a, b) => a.history_id - b.history_id)
      .map((h) => ({ status: historyDto(h).new_status, at: h.changed_at })),
  };
}

module.exports = { resolveQr, getPublicMenu, createOrder, getTrackedOrder };
