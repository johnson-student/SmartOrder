import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';

test('menu: public browsing, owner management, validation and availability checks', async () => {
  const app = createApp({ dbPath: ':memory:' });
  await new Promise((r) => app.server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${app.server.address().port}`;
  async function request(path, method = 'GET', data, cookie) {
    const r = await fetch(base + '/api' + path, {
      method,
      headers: {
        ...(data ? { 'Content-Type': 'application/json' } : {}),
        ...(cookie ? { cookie } : {}),
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    return {
      status: r.status,
      body: await r.json(),
      cookie: r.headers.get('set-cookie')?.split(';')[0],
    };
  }
  try {
        // Customer ordering page and its assets are public.
    for (const file of ['/order', '/order.js', '/order.css'])
      assert.equal((await fetch(base + file)).status, 200, file);
    // Anonymous users cannot manage the menu.
    assert.equal(
      (await request('/menu', 'POST', { name: 'X', category: 'Mains', price: 1 })).status,
      401,
    );
    assert.equal((await request('/menu/manage')).status, 401);

    await request('/setup', 'POST', {
      name: 'Owner',
      email: 'owner@example.com',
      password: 'owner-password',
    });
    const owner = (
      await request('/auth/login', 'POST', { email: 'owner@example.com', password: 'owner-password' })
    ).cookie;
    await request(
      '/users',
      'POST',
      { name: 'Staff', email: 'staff@example.com', password: 'staff-password', role: 'restaurant_staff' },
      owner,
    );
    const staff = (
      await request('/auth/login', 'POST', { email: 'staff@example.com', password: 'staff-password' })
    ).cookie;

    // Staff are not owners.
    assert.equal(
      (await request('/menu', 'POST', { name: 'Soup', category: 'Starters', price: 3 }, staff)).status,
      403,
    );

    // Validation rejects invalid data.
    for (const bad of [
      { name: 'A', category: 'Mains', price: 5 },
      { name: 'Soup', category: 'Mains', price: 0 },
      { name: 'Soup', category: 'Mains', price: -2 },
      { name: 'Soup', category: 'Mains', price: 1.234 },
      { name: 'Soup', category: 'Mains', price: '5' },
      { name: 'Soup', category: 'Mains' },
      { name: 'Soup', category: 'Mains', price: 5, imageUrl: 'http://insecure.example/a.png' },
      { name: 'Soup', category: 'Mains', price: 5, rogue: true },
    ])
      assert.equal((await request('/menu', 'POST', bad, owner)).status, 400, JSON.stringify(bad));

    // Owner creates items.
    const soup = (
      await request(
        '/menu',
        'POST',
        { name: 'Tom yum', category: 'Starters', price: 4.5, description: 'Spicy soup' },
        owner,
      )
    ).body.item;
    const noodles = (
      await request('/menu', 'POST', { name: 'Fried noodles', category: 'Mains', price: 6.2 }, owner)
    ).body.item;
    assert.equal(soup.price, 4.5);
    assert.equal(
      (await request('/menu', 'POST', { name: 'TOM YUM', category: 'Mains', price: 5 }, owner)).status,
      409,
    );

    // Customers (no login) browse, search, and see details.
    assert.equal((await request('/menu')).body.items.length, 2);
    assert.deepEqual(
      (await request('/menu?q=noodle')).body.items.map((i) => i.name),
      ['Fried noodles'],
    );
    assert.equal((await request('/menu?q=zzz')).body.items.length, 0);
    assert.equal((await request('/menu?category=Starters')).body.items.length, 1);
    assert.equal((await request('/menu?q=%25')).body.items.length, 0);
    assert.equal((await request(`/menu/${soup.id}`)).body.item.description, 'Spicy soup');

    // Edit price; mark unavailable; availability check fails for that item.
    assert.equal(
      (await request(`/menu/${soup.id}`, 'PATCH', { price: 5.25 }, owner)).body.item.price,
      5.25,
    );
    await request(`/menu/${soup.id}`, 'PATCH', { available: false }, owner);
    assert.equal((await request(`/menu/${soup.id}`)).body.item.available, false);
    const check = await request('/menu/check', 'POST', { ids: [soup.id, noodles.id, 9999] });
    assert.deepEqual(check.body, { ok: false, unavailable: [soup.id, 9999] });
    assert.equal((await request('/menu/check', 'POST', { ids: ['x'] })).status, 400);

    // Deactivate hides the item from customers but not from the owner.
    await request(`/menu/${noodles.id}`, 'PATCH', { active: false }, owner);
    assert.equal((await request(`/menu/${noodles.id}`)).status, 404);
    assert.equal((await request('/menu')).body.items.length, 1);
    assert.equal((await request('/menu/manage', 'GET', null, owner)).body.items.length, 2);
    assert.equal((await request(`/menu/${noodles.id}`, 'PATCH', { active: false }, staff)).status, 403);

    // Remove.
    assert.equal((await request(`/menu/${noodles.id}`, 'DELETE', null, staff)).status, 403);
    assert.equal((await request(`/menu/${noodles.id}`, 'DELETE', null, owner)).status, 200);
    assert.equal((await request(`/menu/${noodles.id}`, 'DELETE', null, owner)).status, 404);
  } finally {
    await new Promise((r) => app.server.close(r));
    app.close();
  }
});