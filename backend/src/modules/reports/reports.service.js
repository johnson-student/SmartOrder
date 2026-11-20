const { Op, QueryTypes } = require('sequelize');
const { sequelize, Restaurant, Order } = require('../../models');
const { rangeUtc, todayIn, dayOf, addDays } = require('../../utils/dates');
const { parseCents, formatCents } = require('../../utils/money');

// Rule from the report: cancelled orders are not sales. Every other status counts.
async function summary(restaurantId, { from, to }) {
  const restaurant = await Restaurant.findByPk(restaurantId, { attributes: ['timezone'] });
  const tz = restaurant.timezone;
  const today = todayIn(tz);
  const fromDate = from || to || today;
  const toDate = to || from || today;
  const [start, end] = rangeUtc(fromDate, toDate, tz);
  const inRange = { [Op.gte]: start, [Op.lt]: end };

  const orders = await Order.findAll({
    attributes: ['status', 'total', 'created_at'],
    where: { restaurant_id: restaurantId, created_at: inRange },
  });

  let salesCents = 0;
  let orderCount = 0;
  let cancelledCount = 0;
  const perDay = new Map();
  for (let d = fromDate; d <= toDate; d = addDays(d, 1)) perDay.set(d, { orders: 0, cents: 0 });

  for (const o of orders) {
    if (o.status === 'CANCELLED') {
      cancelledCount += 1;
      continue;
    }
    const cents = parseCents(o.total);
    orderCount += 1;
    salesCents += cents;
    const day = perDay.get(dayOf(o.created_at, tz));
    if (day) {
      day.orders += 1;
      day.cents += cents;
    }
  }

  const topItems = await sequelize.query(
    `SELECT oi.item_id,
            MAX(oi.item_name_snapshot) AS name,
            SUM(oi.quantity)           AS quantity,
            SUM(oi.line_total)         AS revenue
       FROM order_items oi
       JOIN orders o ON o.order_id = oi.order_id
      WHERE o.restaurant_id = :restaurantId
        AND o.status <> 'CANCELLED'
        AND o.created_at >= :start AND o.created_at < :end
      GROUP BY oi.item_id
      ORDER BY quantity DESC, revenue DESC, name ASC
      LIMIT 10`,
    { replacements: { restaurantId, start, end }, type: QueryTypes.SELECT },
  );

  return {
    from: fromDate,
    to: toDate,
    timezone: tz,
    order_count: orderCount,
    cancelled_count: cancelledCount,
    sales_total: formatCents(salesCents),
    by_day: [...perDay.entries()].map(([date, v]) => ({
      date,
      order_count: v.orders,
      sales_total: formatCents(v.cents),
    })),
    top_items: topItems.map((r) => ({
      item_id: r.item_id,
      name: r.name,
      quantity: Number(r.quantity),
      revenue: r.revenue,
    })),
  };
}

module.exports = { summary };
