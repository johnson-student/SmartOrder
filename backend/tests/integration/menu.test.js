const { api, bearer, resetDb, registerOwner, setupRestaurant, sequelize } = require('../helpers');

let owner, other, data, auth;

beforeAll(async () => {
  await resetDb();
  owner = await registerOwner();
  other = await registerOwner('Other');
  data = await setupRestaurant(owner.token);
  await setupRestaurant(other.token);
  auth = bearer(owner.token);
});
afterAll(() => sequelize.close());

describe('categories', () => {
  test('name must be unique within the restaurant, but another restaurant may reuse it', async () => {
    const dup = await api().post('/api/v1/categories').set(auth).send({ name: 'Drinks' });
    expect(dup.status).toBe(409);
    expect(dup.body.error.code).toBe('CATEGORY_NAME_TAKEN');
    const otherOk = await api().get('/api/v1/categories').set(bearer(other.token));
    expect(otherOk.body.data.map((c) => c.name)).toContain('Drinks');
  });

  test('empty name -> 400; delete only deactivates and hides from customers', async () => {
    expect((await api().post('/api/v1/categories').set(auth).send({ name: '   ' })).status).toBe(
      400,
    );
    const del = await api().delete(`/api/v1/categories/${data.category.category_id}`).set(auth);
    expect(del.status).toBe(200);
    expect(del.body.data.is_active).toBe(false);
    const menu = await api().get(`/api/v1/public/menu/${data.qrToken}`);
    expect(menu.body.data.categories).toHaveLength(0);
    await api()
      .put(`/api/v1/categories/${data.category.category_id}`)
      .set(auth)
      .send({ is_active: true });
  });
});

describe('menu items', () => {
  test('price rules: 0 is fine, negative / 3 decimals / text are rejected', async () => {
    const make = (price) =>
      api()
        .post('/api/v1/menu-items')
        .set(auth)
        .send({ category_id: data.category.category_id, name: `P${Math.random()}`, price });
    expect((await make(0)).status).toBe(201);
    expect((await make(-1)).status).toBe(400);
    expect((await make(1.999)).status).toBe(400);
    expect((await make('abc')).status).toBe(400);
    const ok = await make(4.2);
    expect(ok.body.data.price).toBe('4.20');
  });

  test("an item cannot be placed in another restaurant's category", async () => {
    const otherCats = (await api().get('/api/v1/categories').set(bearer(other.token))).body.data;
    const res = await api()
      .post('/api/v1/menu-items')
      .set(auth)
      .send({ category_id: otherCats[0].category_id, name: 'Steal', price: 1 });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_CATEGORY');
  });

  test('customers see only active categories and available, active items', async () => {
    await api()
      .put(`/api/v1/menu-items/${data.amok.item_id}`)
      .set(auth)
      .send({ is_available: false });
    let menu = (await api().get(`/api/v1/public/menu/${data.qrToken}`)).body.data;
    let names = menu.categories.flatMap((c) => c.items.map((i) => i.name));
    expect(names).toContain('Latte');
    expect(names).not.toContain('Fish Amok'); // sold out

    await api()
      .put(`/api/v1/menu-items/${data.amok.item_id}`)
      .set(auth)
      .send({ is_available: true });
    await api().delete(`/api/v1/menu-items/${data.latte.item_id}`).set(auth);
    menu = (await api().get(`/api/v1/public/menu/${data.qrToken}`)).body.data;
    names = menu.categories.flatMap((c) => c.items.map((i) => i.name));
    expect(names).toContain('Fish Amok');
    expect(names).not.toContain('Latte'); // deactivated
    await api().put(`/api/v1/menu-items/${data.latte.item_id}`).set(auth).send({ is_active: true });
  });

  test('the public menu exposes no internal fields', async () => {
    const res = await api().get(`/api/v1/public/menu/${data.qrToken}`);
    const text = JSON.stringify(res.body);
    expect(text).not.toMatch(/restaurant_id|is_active|password|code_value/);
    expect(res.body.data.table.table_number).toBe('1');
  });
});
