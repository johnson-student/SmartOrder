const http = require('http');
const { randomUUID } = require('crypto');
const { io: connect } = require('socket.io-client');
const {
  api,
  bearer,
  resetDb,
  registerOwner,
  addMember,
  setupRestaurant,
  sequelize,
} = require('../helpers');
const app = require('../../src/app');
const { initSockets } = require('../../src/sockets');

let server, url, ownerA, ownerB, staffA, dataA, dataB;
const sockets = [];

const client = (auth) => {
  const s = connect(url, { auth, transports: ['websocket'], reconnection: false });
  sockets.push(s);
  return s;
};
const connected = (s) =>
  new Promise((res, rej) => {
    s.on('connect', res);
    s.on('connect_error', rej);
  });
const emitAck = (s, event, payload) => new Promise((res) => s.emit(event, payload, res));
const waitFor = (s, event, ms = 2000) =>
  new Promise((res, rej) => {
    const t = setTimeout(() => rej(new Error(`timeout waiting for ${event}`)), ms);
    s.once(event, (data) => {
      clearTimeout(t);
      res(data);
    });
  });
const collect = (s, event) => {
  const got = [];
  s.on(event, (d) => got.push(d));
  return got;
};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const place = (d) =>
  api()
    .post('/api/v1/public/orders')
    .send({
      qr_token: d.qrToken,
      client_request_id: randomUUID(),
      items: [{ item_id: d.latte.item_id, quantity: 1 }],
    });

beforeAll(async () => {
  await resetDb();
  server = http.createServer(app);
  initSockets(server);
  await new Promise((r) => server.listen(0, r));
  url = `http://localhost:${server.address().port}`;
  ownerA = await registerOwner('A');
  ownerB = await registerOwner('B');
  staffA = await addMember(ownerA.token, 'STAFF');
  dataA = await setupRestaurant(ownerA.token);
  dataB = await setupRestaurant(ownerB.token);
});
afterAll(async () => {
  sockets.forEach((s) => s.close());
  await new Promise((r) => server.close(r));
  await sequelize.close();
});

describe('socket authentication', () => {
  test('a bad token cannot connect; a client without token cannot join a restaurant room', async () => {
    await expect(connected(client({ token: 'garbage' }))).rejects.toBeDefined();
    const anon = client({});
    await connected(anon);
    expect(await emitAck(anon, 'join:restaurant', {})).toMatchObject({
      ok: false,
      error: 'UNAUTHENTICATED',
    });
  });

  test('a customer cannot join an order room with a wrong or invalid token', async () => {
    const c = client({});
    await connected(c);
    expect(await emitAck(c, 'join:order', { token: 'a'.repeat(32) })).toMatchObject({ ok: false });
    expect(await emitAck(c, 'join:order', { token: '../etc' })).toMatchObject({ ok: false });
    expect(await emitAck(c, 'join:order', {})).toMatchObject({ ok: false });
  });
});

describe('end-to-end flow: scan -> order -> staff sees it -> status update -> customer sees it', () => {
  test('events reach only the right rooms and are sent after the data is saved', async () => {
    const staff = client({ token: staffA.token });
    const rivalStaff = client({ token: ownerB.token });
    await Promise.all([connected(staff), connected(rivalStaff)]);
    expect(await emitAck(staff, 'join:restaurant', {})).toEqual({ ok: true });
    expect(await emitAck(rivalStaff, 'join:restaurant', {})).toEqual({ ok: true });

    const createdA = waitFor(staff, 'order:created');
    const rivalCreated = collect(rivalStaff, 'order:created');

    // 1. customer places an order
    const placed = await place(dataA);
    expect(placed.status).toBe(201);
    const { public_token } = placed.body.data;

    // 2. staff of restaurant A are notified, with the order already readable from the database
    const event = await createdA;
    expect(event).toMatchObject({ order_number: 1, status: 'PENDING', total: '3.50' });
    expect(event.items[0].name).toBe('Latte');
    const fromDb = await api().get(`/api/v1/orders/${event.order_id}`).set(bearer(staffA.token));
    expect(fromDb.status).toBe(200);

    // 3. the customer joins the private order room (and a neighbour cannot)
    const customer = client({});
    const otherCustomer = client({});
    await Promise.all([connected(customer), connected(otherCustomer)]);
    expect(await emitAck(customer, 'join:order', { token: public_token })).toEqual({ ok: true });
    const otherToken = (await place(dataB)).body.data.public_token;
    expect(await emitAck(otherCustomer, 'join:order', { token: otherToken })).toEqual({ ok: true });

    const customerGets = waitFor(customer, 'order:status_changed');
    const otherGets = collect(otherCustomer, 'order:status_changed');
    const staffGets = waitFor(staff, 'order:updated');
    const rivalUpdates = collect(rivalStaff, 'order:updated');

    // 4. staff update the status
    const upd = await api()
      .patch(`/api/v1/orders/${event.order_id}/status`)
      .set(bearer(staffA.token))
      .send({ status: 'PREPARING' });
    expect(upd.status).toBe(200);

    // 5. customer and staff are updated
    expect(await customerGets).toMatchObject({ status: 'PREPARING' });
    expect(await staffGets).toMatchObject({
      order_id: event.order_id,
      status: 'PREPARING',
      old_status: 'PENDING',
    });

    // 6. nobody else received anything about restaurant A's order
    await wait(300);
    expect(otherGets).toHaveLength(0);
    expect(rivalUpdates).toHaveLength(0);
    expect(rivalCreated.map((e) => e.order_number)).toEqual([1]); // only B's own order
  });

  test('failed orders emit no event', async () => {
    const staff = client({ token: staffA.token });
    await connected(staff);
    await emitAck(staff, 'join:restaurant', {});
    const events = collect(staff, 'order:created');
    await api()
      .post('/api/v1/public/orders')
      .send({
        qr_token: dataA.qrToken,
        client_request_id: randomUUID(),
        items: [{ item_id: 999999, quantity: 1 }],
      });
    await wait(300);
    expect(events).toHaveLength(0);
  });

  test('deactivating a staff member disconnects their live connection and blocks reconnecting', async () => {
    const victim = await addMember(ownerA.token, 'STAFF');
    const s = client({ token: victim.token });
    await connected(s);
    await emitAck(s, 'join:restaurant', {});
    const closed = new Promise((res) => s.once('disconnect', res));
    await api()
      .patch(`/api/v1/staff/${victim.member_id}`)
      .set(bearer(ownerA.token))
      .send({ is_active: false });
    await closed;
    await expect(connected(client({ token: victim.token }))).rejects.toBeDefined();
  });
});
