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

let owner, staff, data, auth;
const place = (items) =>
  api()
    .post('/api/v1/public/orders')
    .send({ qr_token: data.qrToken, client_request_id: randomUUID(), items });

beforeAll(async () => {
  await resetDb();
  owner = await registerOwner();
  staff = await addMember(owner.token, 'STAFF');
  data = await setupRestaurant(owner.token);
  auth = bearer(owner.token);
});
afterAll(() => sequelize.close());

test('reports count sales, exclude cancelled orders and rank best sellers', async () => {
  await place([{ item_id: data.latte.item_id, quantity: 3 }]); // 10.50
  await place([{ item_id: data.amok.item_id, quantity: 1 }]); // 7.50
  const toCancel = await place([{ item_id: data.amok.item_id, quantity: 5 }]); // 37.50 (will be cancelled)

  const list = (await api().get('/api/v1/orders?limit=100').set(bearer(staff.token))).body.data;
  const id = list.find((o) => o.order_number === toCancel.body.data.order_number).order_id;
  await api()
    .patch(`/api/v1/orders/${id}/status`)
    .set(bearer(staff.token))
    .send({ status: 'CANCELLED', reason: 'Mistake' });

  const res = await api().get('/api/v1/reports/summary').set(auth);
  expect(res.status).toBe(200);
  expect(res.body.data).toMatchObject({ order_count: 2, cancelled_count: 1, sales_total: '18.00' });
  expect(res.body.data.top_items[0]).toMatchObject({
    name: 'Latte',
    quantity: 3,
    revenue: '10.50',
  });
  expect(res.body.data.top_items.map((i) => i.name)).toEqual(['Latte', 'Fish Amok']);
  expect(res.body.data.by_day).toHaveLength(1);
  expect(res.body.data.by_day[0]).toMatchObject({ order_count: 2, sales_total: '18.00' });
});

test('date range filter and validation', async () => {
  const empty = await api().get('/api/v1/reports/summary?from=2000-01-01&to=2000-01-03').set(auth);
  expect(empty.body.data).toMatchObject({ order_count: 0, sales_total: '0.00' });
  expect(empty.body.data.by_day).toHaveLength(3);
  expect(
    (await api().get('/api/v1/reports/summary?from=2026-05-02&to=2026-05-01').set(auth)).status,
  ).toBe(400);
  expect(
    (await api().get('/api/v1/reports/summary?from=2020-01-01&to=2026-01-01').set(auth)).status,
  ).toBe(400);
  expect((await api().get('/api/v1/reports/summary?from=nope').set(auth)).status).toBe(400);
});

test('another restaurant sees none of these sales', async () => {
  const other = await registerOwner('Other');
  const res = await api().get('/api/v1/reports/summary').set(bearer(other.token));
  expect(res.body.data).toMatchObject({ order_count: 0, sales_total: '0.00', top_items: [] });
});
