// Turns database rows into the JSON the API returns. Money stays as text ("12.50").

const itemDto = (i) => ({
  order_item_id: i.order_item_id,
  item_id: i.item_id,
  name: i.item_name_snapshot,
  quantity: i.quantity,
  unit_price: i.unit_price,
  line_total: i.line_total,
  notes: i.notes,
});

const historyDto = (h) => ({
  history_id: h.history_id,
  old_status: h.old_status,
  new_status: h.new_status,
  reason: h.reason,
  changed_at: h.changed_at,
  changed_by: h.changed_by_user ? h.changed_by_user.full_name : null,
});

function serializeOrder(order, { withHistory = false } = {}) {
  const out = {
    order_id: order.order_id,
    order_number: order.order_number,
    status: order.status,
    table: order.table
      ? { table_id: order.table.table_id, table_number: order.table.table_number }
      : { table_id: order.table_id },
    subtotal: order.subtotal,
    total: order.total,
    customer_note: order.customer_note,
    created_at: order.created_at,
    updated_at: order.updated_at,
    items: (order.items || []).map(itemDto),
  };
  if (withHistory) {
    out.history = (order.history || [])
      .slice()
      .sort((a, b) => a.history_id - b.history_id)
      .map(historyDto);
  }
  return out;
}

module.exports = { serializeOrder, itemDto, historyDto };
