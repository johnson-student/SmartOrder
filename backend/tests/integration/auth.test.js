const { api, bearer, resetDb, registerOwner, addMember, sequelize } = require('../helpers');

beforeAll(resetDb);
afterAll(() => sequelize.close());

describe('registration and login', () => {
  test('a new owner registers and gets a token, an OWNER role and a restaurant', async () => {
    const res = await api().post('/api/v1/auth/register').send({
      full_name: 'Sokha',
      email: 'Sokha@Example.com',
      password: 'Password123!',
      restaurant_name: 'Sokha Cafe',
    });
    expect(res.status).toBe(201);
    expect(res.body.data.token).toEqual(expect.any(String));
    expect(res.body.data.role).toBe('OWNER');
    expect(res.body.data.restaurant.name).toBe('Sokha Cafe');
    expect(res.body.data.user.email).toBe('sokha@example.com'); // normalised
    expect(JSON.stringify(res.body)).not.toMatch(/password/i); // never returned
  });

  test('duplicate email -> 409', async () => {
    const res = await api().post('/api/v1/auth/register').send({
      full_name: 'Other',
      email: 'sokha@example.com',
      password: 'Password123!',
      restaurant_name: 'Another',
    });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_TAKEN');
  });

  test('weak password and bad email -> 400 with the standard error shape', async () => {
    const res = await api().post('/api/v1/auth/register').send({
      full_name: 'X',
      email: 'not-an-email',
      password: '123',
      restaurant_name: 'R',
    });
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ success: false, error: { code: 'VALIDATION_ERROR' } });
  });

  test('login works; wrong password and unknown email give the SAME error', async () => {
    const ok = await api()
      .post('/api/v1/auth/login')
      .send({ email: 'sokha@example.com', password: 'Password123!' });
    expect(ok.status).toBe(200);

    const wrong = await api()
      .post('/api/v1/auth/login')
      .send({ email: 'sokha@example.com', password: 'Wrong-pass-1' });
    const unknown = await api()
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@example.com', password: 'Wrong-pass-1' });
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body.error).toEqual(unknown.body.error);
  });

  test('stored passwords are bcrypt hashes', async () => {
    const [rows] = await sequelize.query(
      "SELECT password_hash FROM users WHERE email = 'sokha@example.com'",
    );
    expect(rows[0].password_hash).toMatch(/^\$2[aby]\$/);
    expect(rows[0].password_hash).not.toContain('Password123!');
  });
});

describe('token checks', () => {
  test('missing, malformed and forged tokens are rejected with 401', async () => {
    expect((await api().get('/api/v1/auth/me')).status).toBe(401);
    expect((await api().get('/api/v1/auth/me').set(bearer('abc.def.ghi'))).status).toBe(401);
    const jwt = require('jsonwebtoken');
    const forged = jwt.sign({ sub: 1 }, 'a-different-secret-that-is-long-enough-123');
    expect((await api().get('/api/v1/auth/me').set(bearer(forged))).status).toBe(401);
  });

  test('an expired token is rejected with TOKEN_EXPIRED', async () => {
    const jwt = require('jsonwebtoken');
    const owner = await registerOwner();
    const { sub } = jwt.decode(owner.token);
    const expired = jwt.sign({ sub }, process.env.JWT_SECRET, { expiresIn: -10 });
    const res = await api().get('/api/v1/auth/me').set(bearer(expired));
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('TOKEN_EXPIRED');
  });

  test('GET /auth/me returns user, restaurant and role', async () => {
    const owner = await registerOwner();
    const res = await api().get('/api/v1/auth/me').set(bearer(owner.token));
    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe('OWNER');
    expect(res.body.data.restaurant.currency).toBe('USD');
  });

  test('a deactivated member loses access IMMEDIATELY, even with a valid token, and cannot sign in', async () => {
    const owner = await registerOwner();
    const staff = await addMember(owner.token, 'STAFF');
    expect((await api().get('/api/v1/orders').set(bearer(staff.token))).status).toBe(200);

    const off = await api()
      .patch(`/api/v1/staff/${staff.member_id}`)
      .set(bearer(owner.token))
      .send({ is_active: false });
    expect(off.status).toBe(200);

    const after = await api().get('/api/v1/orders').set(bearer(staff.token));
    expect(after.status).toBe(401);
    const login = await api()
      .post('/api/v1/auth/login')
      .send({ email: staff.email, password: 'Password123!' });
    expect(login.status).toBe(401);
  });
});
