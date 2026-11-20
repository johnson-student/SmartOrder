const {
  api,
  bearer,
  resetDb,
  registerOwner,
  addMember,
  setupRestaurant,
  sequelize,
} = require('../helpers');

let ownerA, ownerB, managerA, staffA, dataA, dataB;

beforeAll(async () => {
  await resetDb();
  ownerA = await registerOwner('A');
  ownerB = await registerOwner('B');
  managerA = await addMember(ownerA.token, 'MANAGER');
  staffA = await addMember(ownerA.token, 'STAFF');
  dataA = await setupRestaurant(ownerA.token);
  dataB = await setupRestaurant(ownerB.token);
});
afterAll(() => sequelize.close());

describe('role-based access (enforced on the backend)', () => {
  test('STAFF can view orders but cannot manage menu, tables, QR, reports, restaurant or staff', async () => {
    const t = bearer(staffA.token);
    expect((await api().get('/api/v1/orders').set(t)).status).toBe(200);
    expect((await api().get('/api/v1/categories').set(t)).status).toBe(403);
    expect((await api().post('/api/v1/categories').set(t).send({ name: 'X' })).status).toBe(403);
    expect((await api().post('/api/v1/menu-items').set(t).send({})).status).toBe(403);
    expect((await api().get('/api/v1/tables').set(t)).status).toBe(403);
    expect((await api().post(`/api/v1/tables/${dataA.table.table_id}/qr`).set(t)).status).toBe(403);
    expect((await api().get('/api/v1/reports/summary').set(t)).status).toBe(403);
    expect((await api().put('/api/v1/restaurant').set(t).send({ name: 'Hack' })).status).toBe(403);
    expect((await api().get('/api/v1/staff').set(t)).status).toBe(403);
  });

  test('MANAGER can manage menu, tables, QR, reports and restaurant info', async () => {
    const t = bearer(managerA.token);
    expect((await api().get('/api/v1/categories').set(t)).status).toBe(200);
    expect((await api().post('/api/v1/tables').set(t).send({ table_number: '9' })).status).toBe(
      201,
    );
    expect((await api().get('/api/v1/reports/summary').set(t)).status).toBe(200);
    const upd = await api()
      .put('/api/v1/restaurant')
      .set(t)
      .send({ name: 'A Renamed', phone: '012' });
    expect(upd.status).toBe(200);
    expect(upd.body.data.name).toBe('A Renamed');
  });

  test('requests without a token get 401', async () => {
    for (const path of [
      '/orders',
      '/categories',
      '/tables',
      '/staff',
      '/reports/summary',
      '/restaurant',
    ]) {
      expect((await api().get(`/api/v1${path}`)).status).toBe(401);
    }
  });
});

describe('staff account rules', () => {
  test('Owner can add Manager and Staff', async () => {
    const m = await addMember(ownerA.token, 'MANAGER');
    expect(m.member_id).toBeDefined();
  });

  test('Manager can add STAFF but not MANAGER', async () => {
    const t = bearer(managerA.token);
    const staff = await api()
      .post('/api/v1/staff')
      .set(t)
      .send({
        full_name: 'New',
        email: 'new-staff@test.dev',
        password: 'Password123!',
        role: 'STAFF',
      });
    expect(staff.status).toBe(201);
    const mgr = await api()
      .post('/api/v1/staff')
      .set(t)
      .send({
        full_name: 'Bad',
        email: 'new-mgr@test.dev',
        password: 'Password123!',
        role: 'MANAGER',
      });
    expect(mgr.status).toBe(403);
  });

  test('role OWNER cannot be created through the API', async () => {
    const res = await api()
      .post('/api/v1/staff')
      .set(bearer(ownerA.token))
      .send({ full_name: 'Boss', email: 'boss@test.dev', password: 'Password123!', role: 'OWNER' });
    expect(res.status).toBe(400);
  });

  test('Manager cannot promote Staff, change a Manager, or touch the Owner; nobody edits themselves', async () => {
    const t = bearer(managerA.token);
    const list = (await api().get('/api/v1/staff').set(bearer(ownerA.token))).body.data;
    const owner = list.find((m) => m.role === 'OWNER');
    const otherManager = list.find((m) => m.role === 'MANAGER' && m.email !== managerA.email);
    const mgrSelf = list.find((m) => m.email === managerA.email);

    expect(
      (await api().patch(`/api/v1/staff/${staffA.member_id}`).set(t).send({ role: 'MANAGER' }))
        .status,
    ).toBe(403);
    expect(
      (
        await api()
          .patch(`/api/v1/staff/${otherManager.member_id}`)
          .set(t)
          .send({ is_active: false })
      ).status,
    ).toBe(403);
    expect(
      (await api().patch(`/api/v1/staff/${owner.member_id}`).set(t).send({ is_active: false }))
        .status,
    ).toBe(403);
    expect(
      (
        await api()
          .patch(`/api/v1/staff/${owner.member_id}`)
          .set(bearer(ownerA.token))
          .send({ is_active: false })
      ).status,
    ).toBe(403);
    expect(
      (await api().patch(`/api/v1/staff/${mgrSelf.member_id}`).set(t).send({ is_active: false }))
        .status,
    ).toBe(403);
  });

  test('duplicate staff email -> 409', async () => {
    const res = await api()
      .post('/api/v1/staff')
      .set(bearer(ownerA.token))
      .send({ full_name: 'Dup', email: staffA.email, password: 'Password123!', role: 'STAFF' });
    expect(res.status).toBe(409);
  });
});

describe('restaurant isolation (tenant safety)', () => {
  test("restaurant A never sees restaurant B's categories, items, tables or staff", async () => {
    const t = bearer(ownerA.token);
    const cats = (await api().get('/api/v1/categories').set(t)).body.data.map((c) => c.category_id);
    expect(cats).toContain(dataA.category.category_id);
    expect(cats).not.toContain(dataB.category.category_id);

    const items = (await api().get('/api/v1/menu-items').set(t)).body.data.map((i) => i.item_id);
    expect(items).toContain(dataA.latte.item_id);
    expect(items).not.toContain(dataB.latte.item_id);

    const tables = (await api().get('/api/v1/tables').set(t)).body.data.map((x) => x.table_id);
    expect(tables).not.toContain(dataB.table.table_id);

    const staff = (await api().get('/api/v1/staff').set(t)).body.data;
    expect(staff.every((m) => !m.email.startsWith('owner2@'))).toBe(true);
  });

  test("restaurant A cannot read or change B's records by guessing IDs (404)", async () => {
    const t = bearer(ownerA.token);
    expect(
      (
        await api()
          .put(`/api/v1/categories/${dataB.category.category_id}`)
          .set(t)
          .send({ name: 'Hacked' })
      ).status,
    ).toBe(404);
    expect(
      (await api().delete(`/api/v1/categories/${dataB.category.category_id}`).set(t)).status,
    ).toBe(404);
    expect(
      (await api().put(`/api/v1/menu-items/${dataB.latte.item_id}`).set(t).send({ name: 'Hacked' }))
        .status,
    ).toBe(404);
    expect(
      (
        await api()
          .put(`/api/v1/tables/${dataB.table.table_id}`)
          .set(t)
          .send({ table_number: '77' })
      ).status,
    ).toBe(404);
    expect((await api().post(`/api/v1/tables/${dataB.table.table_id}/qr`).set(t)).status).toBe(404);
    expect((await api().get(`/api/v1/tables/${dataB.table.table_id}/qr`).set(t)).status).toBe(404);

    // B's data is unchanged
    const bCats = (await api().get('/api/v1/categories').set(bearer(ownerB.token))).body.data;
    expect(bCats.find((c) => c.category_id === dataB.category.category_id)).toMatchObject({
      name: 'Drinks',
      is_active: true,
    });
  });

  test("a client-supplied restaurant_id is ignored: new records always go to the caller's restaurant", async () => {
    const t = bearer(ownerA.token);
    const res = await api()
      .post('/api/v1/categories')
      .set(t)
      .send({ name: 'Sneaky', restaurant_id: dataB.table.restaurant_id || 999 });
    expect(res.status).toBe(201);
    const [rows] = await sequelize.query(
      'SELECT restaurant_id FROM categories WHERE category_id = :id',
      { replacements: { id: res.body.data.category_id } },
    );
    expect(rows[0].restaurant_id).toBe(ownerA.restaurant.restaurant_id);
  });
});
