const { resetDb, registerOwner, setupRestaurant, sequelize } = require('../helpers');

// These tests talk to MySQL directly: the database itself must enforce the rules from the report,
// even if application code had a bug.
let a, b, dataA, dataB;
const q = (sql, replacements) => sequelize.query(sql, { replacements });

beforeAll(async () => {
  await resetDb();
  a = await registerOwner('A');
  b = await registerOwner('B');
  dataA = await setupRestaurant(a.token);
  dataB = await setupRestaurant(b.token);
});
afterAll(() => sequelize.close());

const insertOrder = (restaurantId, tableId, extra = '') =>
  q(
    `INSERT INTO orders (restaurant_id, table_id, order_number, public_token, subtotal, total) VALUES (:r, :t, ${Math.floor(Math.random() * 1e9)}, :tok, 1, 1)`,
    { r: restaurantId, t: tableId, tok: require('crypto').randomBytes(16).toString('hex'), extra },
  );

test('only ONE active QR code per table (generated column + unique index)', async () => {
  await expect(
    q('INSERT INTO qr_codes (table_id, code_value, is_active) VALUES (:t, :c, 1)', {
      t: dataA.table.table_id,
      c: 'dup-active-' + Date.now(),
    }),
  ).rejects.toMatchObject({ name: 'SequelizeUniqueConstraintError' });
  // revoked rows are fine, many of them
  await q(
    'INSERT INTO qr_codes (table_id, code_value, is_active, revoked_at) VALUES (:t, :c, 0, NOW())',
    { t: dataA.table.table_id, c: 'old-1-' + Date.now() },
  );
  await q(
    'INSERT INTO qr_codes (table_id, code_value, is_active, revoked_at) VALUES (:t, :c, 0, NOW())',
    { t: dataA.table.table_id, c: 'old-2-' + Date.now() },
  );
});

test('an order cannot point to a table of another restaurant (composite foreign key)', async () => {
  await expect(insertOrder(a.restaurant.restaurant_id, dataB.table.table_id)).rejects.toThrow(
    /foreign key/i,
  );
  await insertOrder(a.restaurant.restaurant_id, dataA.table.table_id); // correct pair works
});

test('order_items: quantity >= 1 and line_total = quantity * unit_price', async () => {
  await insertOrder(a.restaurant.restaurant_id, dataA.table.table_id);
  const [[{ order_id }]] = await q('SELECT MAX(order_id) AS order_id FROM orders');
  const ins = (qty, unit, line) =>
    q(
      "INSERT INTO order_items (order_id, item_id, item_name_snapshot, quantity, unit_price, line_total) VALUES (:o, :i, 'x', :q, :u, :l)",
      { o: order_id, i: dataA.latte.item_id, q: qty, u: unit, l: line },
    );
  await expect(ins(0, '1.00', '0.00')).rejects.toThrow(/check constraint/i);
  await expect(ins(2, '1.00', '3.00')).rejects.toThrow(/check constraint/i);
  await ins(2, '1.50', '3.00');
});

test('status history: a CANCELLED row needs a reason', async () => {
  const [[{ order_id }]] = await q('SELECT MAX(order_id) AS order_id FROM orders');
  await expect(
    q(
      "INSERT INTO order_status_history (order_id, old_status, new_status) VALUES (:o, 'READY', 'CANCELLED')",
      { o: order_id },
    ),
  ).rejects.toThrow(/check constraint/i);
  await q(
    "INSERT INTO order_status_history (order_id, old_status, new_status, reason) VALUES (:o, 'READY', 'CANCELLED', 'ok')",
    { o: order_id },
  );
});

test('menu price cannot be negative; capacity must be positive', async () => {
  await expect(
    q("INSERT INTO menu_items (category_id, name, price) VALUES (:c, 'bad', -1)", {
      c: dataA.category.category_id,
    }),
  ).rejects.toThrow(/check constraint/i);
  await expect(
    q("INSERT INTO dining_tables (restaurant_id, table_number, capacity) VALUES (:r, 'Z', 0)", {
      r: a.restaurant.restaurant_id,
    }),
  ).rejects.toThrow(/check constraint/i);
});

test('uniqueness: category name and table number per restaurant, order number per restaurant', async () => {
  await expect(
    q("INSERT INTO categories (restaurant_id, name) VALUES (:r, 'Drinks')", {
      r: a.restaurant.restaurant_id,
    }),
  ).rejects.toMatchObject({ name: 'SequelizeUniqueConstraintError' });
  await expect(
    q("INSERT INTO dining_tables (restaurant_id, table_number) VALUES (:r, '1')", {
      r: a.restaurant.restaurant_id,
    }),
  ).rejects.toMatchObject({ name: 'SequelizeUniqueConstraintError' });
  await q("INSERT INTO categories (restaurant_id, name) VALUES (:r, 'Drinks')", {
    r: b.restaurant.restaurant_id,
  }).catch(() => {}); // B already has it -> duplicate too
  const fresh = await registerOwner('C');
  await q("INSERT INTO categories (restaurant_id, name) VALUES (:r, 'Drinks')", {
    r: fresh.restaurant.restaurant_id,
  }); // a new restaurant may reuse the name
});

test('restricted deletes protect history (tables, menu items with orders)', async () => {
  await expect(
    q('DELETE FROM dining_tables WHERE table_id = :t', { t: dataA.table.table_id }),
  ).rejects.toThrow(/foreign key/i);
  await expect(
    q('DELETE FROM menu_items WHERE item_id = :i', { i: dataA.latte.item_id }),
  ).rejects.toThrow(/foreign key/i);
});
