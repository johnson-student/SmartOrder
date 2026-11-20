const { api, bearer, resetDb, registerOwner, setupRestaurant, sequelize } = require('../helpers');

let owner, data, auth;

beforeAll(async () => {
  await resetDb();
  owner = await registerOwner();
  data = await setupRestaurant(owner.token);
  auth = bearer(owner.token);
});
afterAll(() => sequelize.close());

describe('QR codes', () => {
  test('token is random, 64 hex characters, not the table number; image is a PNG data URL', () => {
    expect(data.qrToken).toMatch(/^[a-f0-9]{64}$/);
    expect(data.qr.url).toBe(`http://localhost:5173/menu/${data.qrToken}`);
    expect(data.qr.image).toMatch(/^data:image\/png;base64,/);
  });

  test('a valid token opens the right restaurant and table', async () => {
    const res = await api().get(`/api/v1/public/menu/${data.qrToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.restaurant.name).toMatch(/^Cafe/);
    expect(res.body.data.table.table_number).toBe('1');
  });

  test('regenerating revokes the old token and issues a different new one', async () => {
    const res = await api().post(`/api/v1/tables/${data.table.table_id}/qr`).set(auth);
    expect(res.status).toBe(201);
    const newToken = res.body.data.url.split('/').pop();
    expect(newToken).not.toBe(data.qrToken);

    const old = await api().get(`/api/v1/public/menu/${data.qrToken}`);
    expect(old.status).toBe(404);
    expect(old.body.error.code).toBe('QR_INVALID');
    expect((await api().get(`/api/v1/public/menu/${newToken}`)).status).toBe(200);

    const [rows] = await sequelize.query(
      'SELECT is_active, revoked_at FROM qr_codes WHERE table_id = :id ORDER BY qr_id',
      { replacements: { id: data.table.table_id } },
    );
    expect(rows.map((r) => r.is_active)).toEqual([0, 1]);
    expect(rows[0].revoked_at).not.toBeNull();
    data.qrToken = newToken;
  });

  test('GET returns the active QR for download', async () => {
    const res = await api().get(`/api/v1/tables/${data.table.table_id}/qr`).set(auth);
    expect(res.status).toBe(200);
    expect(res.body.data.url.endsWith(data.qrToken)).toBe(true);
  });

  test('garbage, unknown and wrong-length tokens -> 404 QR_INVALID', async () => {
    for (const t of ['abc', 'x'.repeat(64), 'a'.repeat(64), '1'.repeat(10)]) {
      const res = await api().get(`/api/v1/public/menu/${t}`);
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('QR_INVALID');
    }
  });

  test('an inactive table stops working for customers and cannot get a new QR', async () => {
    await api().delete(`/api/v1/tables/${data.table.table_id}`).set(auth);
    expect((await api().get(`/api/v1/public/menu/${data.qrToken}`)).status).toBe(404);
    const regen = await api().post(`/api/v1/tables/${data.table.table_id}/qr`).set(auth);
    expect(regen.status).toBe(409);
    expect(regen.body.error.code).toBe('TABLE_INACTIVE');
    await api().put(`/api/v1/tables/${data.table.table_id}`).set(auth).send({ is_active: true });
    expect((await api().get(`/api/v1/public/menu/${data.qrToken}`)).status).toBe(200);
  });

  test('table numbers are unique per restaurant', async () => {
    const dup = await api().post('/api/v1/tables').set(auth).send({ table_number: '1' });
    expect(dup.status).toBe(409);
    expect(dup.body.error.code).toBe('TABLE_NUMBER_TAKEN');
    expect(
      (await api().post('/api/v1/tables').set(auth).send({ table_number: 'A2', capacity: 0 }))
        .status,
    ).toBe(400);
  });

  test('tables list shows which tables have an active QR', async () => {
    await api().post('/api/v1/tables').set(auth).send({ table_number: '2' });
    const list = (await api().get('/api/v1/tables').set(auth)).body.data;
    expect(list.find((t) => t.table_number === '1').has_active_qr).toBe(true);
    expect(list.find((t) => t.table_number === '2').has_active_qr).toBe(false);
    expect(
      (
        await api()
          .get(`/api/v1/tables/${list.find((t) => t.table_number === '2').table_id}/qr`)
          .set(auth)
      ).status,
    ).toBe(404);
  });
});
