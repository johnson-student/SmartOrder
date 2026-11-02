import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('profile and owner account workflows enforce permissions and persist data', async () => {
  const folder = mkdtempSync(join(tmpdir(), 'smartorder-'));
  const dbPath = join(folder, 'test.sqlite');
  let app;
  let base;
  async function start() {
    app = createApp({ dbPath });
    await new Promise((r) => app.server.listen(0, '127.0.0.1', r));
    base = `http://127.0.0.1:${app.server.address().port}`;
  }
  async function stop() {
    await new Promise((r) => app.server.close(r));
    app.close();
  }
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
    await start();
    assert.equal((await request('/me')).status, 401);
    assert.equal(
      (
        await request('/setup', 'POST', {
          name: 'Owner',
          email: 'owner@example.com',
          password: 'owner-password',
        })
      ).status,
      201,
    );
    assert.equal((await request('/setup', 'POST', {})).status, 409);
    assert.equal(
      (await request('/auth/login', 'POST', { email: 'owner@example.com', password: 'incorrect' }))
        .status,
      401,
    );
    const owner = (
      await request('/auth/login', 'POST', {
        email: 'owner@example.com',
        password: 'owner-password',
      })
    ).cookie;
    assert.ok(owner);
    const created = await request(
      '/users',
      'POST',
      {
        name: 'Staff',
        email: 'staff@example.com',
        password: 'staff-password',
        role: 'restaurant_staff',
      },
      owner,
    );
    assert.equal(created.status, 201);
    assert.equal(created.body.user.password_hash, undefined);
    const id = created.body.user.id;
    const staff = (
      await request('/auth/login', 'POST', {
        email: 'staff@example.com',
        password: 'staff-password',
      })
    ).cookie;
    assert.equal((await request('/users', 'GET', undefined, staff)).status, 403);
    assert.equal((await request('/users/' + id, 'PATCH', { role: 'owner' }, staff)).status, 403);
    assert.equal((await request('/me', 'PATCH', { role: 'owner' }, staff)).status, 400);
    assert.equal((await request('/me', 'PATCH', { email: 'bad' }, staff)).status, 400);
    assert.equal(
      (await request('/me', 'PATCH', { email: 'OWNER@example.com' }, staff)).status,
      409,
    );
    assert.equal(
      (await request('/me', 'PATCH', { name: 'Updated Staff', phone: '+855 12345678' }, staff))
        .status,
      200,
    );
    assert.equal((await request('/me', 'GET', undefined, staff)).body.user.name, 'Updated Staff');
    assert.equal((await request('/users/1', 'PATCH', { active: false }, owner)).status, 409);
    assert.equal(
      (await request('/users/1', 'PATCH', { role: 'kitchen_staff' }, owner)).status,
      409,
    );
    assert.equal((await request('/users/' + id, 'PATCH', { active: false }, owner)).status, 200);
    assert.equal((await request('/me', 'GET', undefined, staff)).status, 401);
    assert.equal(
      (
        await request('/auth/login', 'POST', {
          email: 'staff@example.com',
          password: 'staff-password',
        })
      ).status,
      401,
    );
    assert.equal((await request('/users/' + id, 'PATCH', { active: true }, owner)).status, 200);
    const cross = await fetch(base + '/api/me', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        origin: 'https://evil.example',
        cookie: owner,
      },
      body: JSON.stringify({ name: 'Intruder' }),
    });
    assert.equal(cross.status, 403);
    await stop();
    await start();
    assert.equal((await request('/me', 'GET', undefined, owner)).status, 200);
    const list = await request('/users', 'GET', undefined, owner);
    assert.equal(list.body.users.find((u) => u.id === id).name, 'Updated Staff');
    assert.equal((await request('/auth/logout', 'POST', undefined, owner)).status, 200);
    assert.equal((await request('/me', 'GET', undefined, owner)).status, 401);

    assert.equal((await fetch(base)).status, 200);
    for (const asset of ['/app.js', '/styles.css']) {
      const response = await fetch(base + asset);
      assert.equal(response.status, 200);
      assert.ok((await response.text()).length > 0);
    }
  } finally {
    if (app.server.listening) await stop();
    rmSync(folder, { recursive: true, force: true });
  }
});
