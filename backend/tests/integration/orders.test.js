const { randomUUID } = require('crypto');
const {
  api,
  bearer,
  resetDb,
  registerOwner,
  addMember,
  setupRestaurant,
  sequelize,
} = require('../helpers');

let ownerA, ownerB, staffA, dataA, dataB, auth;

const place = (qrToken, items, extra = {}) =>
  api()
    .post('/api/v1/public/orders')
    .send({ qr_token: qrToken, client_request_id: randomUUID(), items, ...extra });

beforeAll(async () => {
  await resetDb();
  ownerA = await registerOwner('A');
  ownerB = await registerOwner('B');
  staffA = await addMember(ownerA.token, 'STAFF');
  dataA = await setupRestaurant(ownerA.token);
  dataB = await setupRestaurant(ownerB.token);
  auth = bearer(staffA.token);
});
afterAll(() => sequelize.close());

describe('customer checkout', () => {
  test('server calculates prices; any client-sent price is ignored', async () => {
    const res = await place(
      dataA.qrToken,
      [
        {
          item_id: dataA.latte.item_id,
          quantity: 2,
          unit_price: '0.01',
          price: 0,
          line_total: '0.02',
        },
        { item_id: dataA.amok.item_id, quantity: 1, notes: 'no chili' },
      ],
      { customer_note: 'Birthday table', total: '0.01', table_id: 999, restaurant_id: 999 },
    );
    expect(res.status).toBe(201);
    expect(res.body.data.total).toBe('14.50'); // 2 x 3.50 + 7.50
    expect(res.body.data.order_number).toBe(1);
    expect(res.body.data.public_token).toMatch(/^[a-f0-9]{32}$/);
    expect(res.body.data.status).toBe('PENDING');

    // table and restaurant came from the QR token, not from the request
    const [rows] = await sequelize.query(
      'SELECT restaurant_id, table_id FROM orders WHERE order_number = 1',
    );
    expect(rows[0].restaurant_id).toBe(ownerA.restaurant.restaurant_id);
    expect(rows[0].table_id).toBe(dataA.table.table_id);
  });

  test('order numbers are sequential per restaurant', async () => {
    const a2 = await place(dataA.qrToken, [{ item_id: dataA.latte.item_id, quantity: 1 }]);
    const b1 = await place(dataB.qrToken, [{ item_id: dataB.latte.item_id, quantity: 1 }]);
    expect(a2.body.data.order_number).toBe(2);
    expect(b1.body.data.order_number).toBe(1); // restaurant B has its own counter
  });

  test('empty cart, zero / fractional / huge quantity, bad uuid, bad item id -> 400', async () => {
    expect((await place(dataA.qrToken, [])).status).toBe(400);
    expect(
      (await place(dataA.qrToken, [{ item_id: dataA.latte.item_id, quantity: 0 }])).status,
    ).toBe(400);
    expect(
      (await place(dataA.qrToken, [{ item_id: dataA.latte.item_id, quantity: 1.5 }])).status,
    ).toBe(400);
    expect(
      (await place(dataA.qrToken, [{ item_id: dataA.latte.item_id, quantity: 100 }])).status,
    ).toBe(400);
    expect((await place(dataA.qrToken, [{ item_id: 'abc', quantity: 1 }])).status).toBe(400);
    const badId = await api()
      .post('/api/v1/public/orders')
      .send({
        qr_token: dataA.qrToken,
        client_request_id: 'nope',
        items: [{ item_id: dataA.latte.item_id, quantity: 1 }],
      });
    expect(badId.status).toBe(400);
  });

  test("unavailable items and another restaurant's items -> 422, and nothing is saved", async () => {
    await api()
      .put(`/api/v1/menu-items/${dataA.amok.item_id}`)
      .set(bearer(ownerA.token))
      .send({ is_available: false });
    const before = (await sequelize.query('SELECT COUNT(*) c FROM orders'))[0][0].c;

    const soldOut = await place(dataA.qrToken, [
      { item_id: dataA.latte.item_id, quantity: 1 },
      { item_id: dataA.amok.item_id, quantity: 1 },
    ]);
    expect(soldOut.status).toBe(422);
    expect(soldOut.body.error.code).toBe('ITEM_UNAVAILABLE');
    expect(soldOut.body.error.details.item_ids).toEqual([dataA.amok.item_id]);

    const foreign = await place(dataA.qrToken, [{ item_id: dataB.latte.item_id, quantity: 1 }]);
    expect(foreign.status).toBe(422);

    const after = (await sequelize.query('SELECT COUNT(*) c FROM orders'))[0][0].c;
    expect(after).toBe(before); // all-or-nothing
    await api()
      .put(`/api/v1/menu-items/${dataA.amok.item_id}`)
      .set(bearer(ownerA.token))
      .send({ is_available: true });
  });

  test('a failed checkout does not waste an order number', async () => {
    const [[{ n }]] = await sequelize.query(
      'SELECT next_order_number n FROM restaurants WHERE restaurant_id = :id',
      { replacements: { id: ownerA.restaurant.restaurant_id } },
    );
    await place(dataA.qrToken, [{ item_id: 999999, quantity: 1 }]);
    const [[{ n: n2 }]] = await sequelize.query(
      'SELECT next_order_number n FROM restaurants WHERE restaurant_id = :id',
      { replacements: { id: ownerA.restaurant.restaurant_id } },
    );
    expect(n2).toBe(n);
  });

  test('invalid or revoked QR code cannot order', async () => {
    expect(
      (await place('f'.repeat(64), [{ item_id: dataA.latte.item_id, quantity: 1 }])).status,
    ).toBe(404);
    const regen = await api()
      .post(`/api/v1/tables/${dataA.table.table_id}/qr`)
      .set(bearer(ownerA.token));
    const res = await place(dataA.qrToken, [{ item_id: dataA.latte.item_id, quantity: 1 }]);
    expect(res.status).toBe(404);
    dataA.qrToken = regen.body.data.url.split('/').pop();
  });

  test('submitting the same client_request_id twice creates ONE order (double click safe)', async () => {
    const body = {
      qr_token: dataA.qrToken,
      client_request_id: randomUUID(),
      items: [{ item_id: dataA.latte.item_id, quantity: 1 }],
    };
    const first = await api().post('/api/v1/public/orders').send(body);
    const second = await api().post('/api/v1/public/orders').send(body);
    expect(first.status).toBe(201);
    expect(second.status).toBe(200);
    expect(second.body.data.public_token).toBe(first.body.data.public_token);
    expect(second.body.data.order_number).toBe(first.body.data.order_number);
    const [[{ c }]] = await sequelize.query(
      'SELECT COUNT(*) c FROM orders WHERE client_request_id = :id',
      { replacements: { id: body.client_request_id } },
    );
    expect(c).toBe(1);
  });

  test('simultaneous double submit still creates ONE order', async () => {
    const body = {
      qr_token: dataA.qrToken,
      client_request_id: randomUUID(),
      items: [{ item_id: dataA.latte.item_id, quantity: 1 }],
    };
    const results = await Promise.all(
      [1, 2, 3].map(() => api().post('/api/v1/public/orders').send(body)),
    );
    expect(new Set(results.map((r) => r.body.data.public_token)).size).toBe(1);
    expect(results.every((r) => [200, 201].includes(r.status))).toBe(true);
  });

  test('simultaneous different orders get different, gap-free order numbers', async () => {
    const [[{ n }]] = await sequelize.query(
      'SELECT next_order_number n FROM restaurants WHERE restaurant_id = :id',
      { replacements: { id: ownerB.restaurant.restaurant_id } },
    );
    const results = await Promise.all(
      Array.from({ length: 8 }, () =>
        place(dataB.qrToken, [{ item_id: dataB.latte.item_id, quantity: 1 }]),
      ),
    );
    const numbers = results.map((r) => r.body.data.order_number).sort((a, b) => a - b);
    expect(results.every((r) => r.status === 201)).toBe(true);
    expect(numbers).toEqual(Array.from({ length: 8 }, (_, i) => n + i));
  });
});

describe('snapshots', () => {
  test('changing a menu price or name later never changes an old order', async () => {
    const placed = await place(dataA.qrToken, [{ item_id: dataA.latte.item_id, quantity: 2 }]);
    await api()
      .put(`/api/v1/menu-items/${dataA.latte.item_id}`)
      .set(bearer(ownerA.token))
      .send({ price: 99, name: 'Renamed Latte' });

    const list = (await api().get('/api/v1/orders?limit=100').set(auth)).body.data;
    const orderId = list.find((o) => o.order_number === placed.body.data.order_number).order_id;
    const order = (await api().get(`/api/v1/orders/${orderId}`).set(auth)).body.data;
    expect(order.total).toBe('7.00');
    expect(order.items[0]).toMatchObject({ name: 'Latte', unit_price: '3.50', line_total: '7.00' });

    const next = await place(dataA.qrToken, [{ item_id: dataA.latte.item_id, quantity: 1 }]);
    expect(next.body.data.total).toBe('99.00'); // new orders use the new price
    await api()
      .put(`/api/v1/menu-items/${dataA.latte.item_id}`)
      .set(bearer(ownerA.token))
      .send({ price: 3.5, name: 'Latte' });
  });
});

describe('staff order management', () => {
  let orderId, token;

  beforeAll(async () => {
    const placed = await place(dataA.qrToken, [{ item_id: dataA.latte.item_id, quantity: 1 }]);
    token = placed.body.data.public_token;
    const list = (await api().get('/api/v1/orders?limit=100').set(auth)).body.data;
    orderId = list.find((o) => o.order_number === placed.body.data.order_number).order_id;
  });

  test('list supports active / status / date filters and pagination', async () => {
    const active = await api().get('/api/v1/orders?active=true&sort=asc').set(auth);
    expect(active.status).toBe(200);
    expect(
      active.body.data.every((o) => ['PENDING', 'PREPARING', 'READY'].includes(o.status)),
    ).toBe(true);
    expect(active.body.data[0].items.length).toBeGreaterThan(0);
    expect(active.body.data[0].table.table_number).toBe('1');

    const paged = await api().get('/api/v1/orders?limit=2&page=1').set(auth);
    expect(paged.body.data).toHaveLength(2);
    expect(paged.body.meta).toMatchObject({ page: 1, limit: 2 });
    expect(paged.body.meta.total_pages).toBeGreaterThan(1);

    const none = await api().get('/api/v1/orders?from=2000-01-01&to=2000-01-02').set(auth);
    expect(none.body.data).toHaveLength(0);
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Phnom_Penh' }).format(
      new Date(),
    );
    expect(
      (await api().get(`/api/v1/orders?from=${today}&to=${today}`).set(auth)).body.data.length,
    ).toBeGreaterThan(0);

    expect((await api().get('/api/v1/orders?status=NOPE').set(auth)).status).toBe(400);
    expect((await api().get('/api/v1/orders?from=2026-13-40').set(auth)).status).toBe(400);
  });

  test('valid transitions work and every change is logged with who/when', async () => {
    const t1 = await api()
      .patch(`/api/v1/orders/${orderId}/status`)
      .set(auth)
      .send({ status: 'PREPARING' });
    expect(t1.status).toBe(200);
    expect(t1.body.data.status).toBe('PREPARING');
    const t2 = await api()
      .patch(`/api/v1/orders/${orderId}/status`)
      .set(auth)
      .send({ status: 'READY' });
    expect(t2.body.data.status).toBe('READY');

    const detail = (await api().get(`/api/v1/orders/${orderId}`).set(auth)).body.data;
    expect(detail.history.map((h) => [h.old_status, h.new_status])).toEqual([
      [null, 'PENDING'],
      ['PENDING', 'PREPARING'],
      ['PREPARING', 'READY'],
    ]);
    expect(detail.history[0].changed_by).toBeNull(); // created by the customer
    expect(detail.history[1].changed_by).toMatch(/^STAFF/);
  });

  test('invalid transitions are rejected and the order does not change', async () => {
    const skip = await api()
      .patch(`/api/v1/orders/${orderId}/status`)
      .set(auth)
      .send({ status: 'PREPARING' });
    expect(skip.status).toBe(409);
    expect(skip.body.error.code).toBe('INVALID_TRANSITION');
    expect(
      (await api().patch(`/api/v1/orders/${orderId}/status`).set(auth).send({ status: 'PENDING' }))
        .status,
    ).toBe(400);
    expect(
      (await api().patch(`/api/v1/orders/${orderId}/status`).set(auth).send({ status: 'BOGUS' }))
        .status,
    ).toBe(400);
    expect((await api().get(`/api/v1/orders/${orderId}`).set(auth)).body.data.status).toBe('READY');
  });

  test('cancelling needs a reason; COMPLETED and CANCELLED are final', async () => {
    const noReason = await api()
      .patch(`/api/v1/orders/${orderId}/status`)
      .set(auth)
      .send({ status: 'CANCELLED' });
    expect(noReason.status).toBe(400);
    expect(
      (
        await api()
          .patch(`/api/v1/orders/${orderId}/status`)
          .set(auth)
          .send({ status: 'CANCELLED', reason: '   ' })
      ).status,
    ).toBe(400);

    const done = await api()
      .patch(`/api/v1/orders/${orderId}/status`)
      .set(auth)
      .send({ status: 'COMPLETED' });
    expect(done.status).toBe(200);
    const again = await api()
      .patch(`/api/v1/orders/${orderId}/status`)
      .set(auth)
      .send({ status: 'CANCELLED', reason: 'too late' });
    expect(again.status).toBe(409);

    const placed = await place(dataA.qrToken, [{ item_id: dataA.latte.item_id, quantity: 1 }]);
    const list = (await api().get('/api/v1/orders?status=PENDING&limit=100').set(auth)).body.data;
    const id = list.find((o) => o.order_number === placed.body.data.order_number).order_id;
    const cancelled = await api()
      .patch(`/api/v1/orders/${id}/status`)
      .set(auth)
      .send({ status: 'CANCELLED', reason: 'Customer left' });
    expect(cancelled.status).toBe(200);
    expect(cancelled.body.data.history.at(-1)).toMatchObject({
      new_status: 'CANCELLED',
      reason: 'Customer left',
    });
    expect(
      (await api().patch(`/api/v1/orders/${id}/status`).set(auth).send({ status: 'PREPARING' }))
        .status,
    ).toBe(409);
  });

  test("another restaurant's staff cannot see, open or change this order", async () => {
    const other = bearer(ownerB.token);
    const list = (await api().get('/api/v1/orders?limit=100').set(other)).body.data;
    expect(list.find((o) => o.order_id === orderId)).toBeUndefined();
    expect((await api().get(`/api/v1/orders/${orderId}`).set(other)).status).toBe(404);
    expect(
      (
        await api()
          .patch(`/api/v1/orders/${orderId}/status`)
          .set(other)
          .send({ status: 'PREPARING' })
      ).status,
    ).toBe(404);
  });

  test('customer tracking by private token shows status, but not staff details; wrong tokens fail', async () => {
    const res = await api().get(`/api/v1/public/orders/${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ status: 'COMPLETED', table_number: '1' });
    expect(res.body.data.items[0].name).toBe('Latte');
    expect(res.body.data.history.map((h) => h.status)).toEqual([
      'PENDING',
      'PREPARING',
      'READY',
      'COMPLETED',
    ]);
    const text = JSON.stringify(res.body);
    expect(text).not.toMatch(/changed_by|reason|restaurant_id|order_id|public_token/);

    expect((await api().get(`/api/v1/public/orders/${'a'.repeat(32)}`)).status).toBe(404);
    expect((await api().get('/api/v1/public/orders/123')).status).toBe(404);
    expect((await api().get('/api/v1/public/orders/1')).status).toBe(404); // numeric IDs are not accepted
  });
});
