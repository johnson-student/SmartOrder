import { readJson, sendJson, fail } from '../http.js';
import { validateUser } from '../validation.js';
import { hashPassword, checkPassword } from '../security.js';
import { toPublicUser } from '../repositories/users.js';

export function createAuthController(users, sessions) {
  let setupPending = false;
  const loginAttempts = new Map();

  function checkLoginLimit(address) {
    const now = Date.now();
    for (const [key, attempt] of loginAttempts) {
      if (attempt.expires <= now) loginAttempts.delete(key);
    }
    const attempt = loginAttempts.get(address) || { count: 0, expires: now + 60000 };
    if (attempt.count >= 10) fail(429, 'Too many login attempts. Try again in one minute.');
    attempt.count++;
    loginAttempts.set(address, attempt);
  }

  return {
    setupStatus(request, response) {
      sendJson(response, 200, { needsSetup: users.count() === 0 });
    },
    async setup(request, response) {
      const input = await readJson(request);
      if (users.count() || setupPending) fail(409, 'Setup is already complete or in progress.');
      // Reserve first-owner setup before password hashing yields to another request.
      setupPending = true;
      try {
        const values = validateUser(input, { creating: true, admin: true });
        const passwordHash = await hashPassword(values.password);
        const user = users.create({ ...values, role: 'owner', active: 1 }, passwordHash);
        sendJson(response, 201, { user: toPublicUser(user) });
      } finally {
        setupPending = false;
      }
    },
    async login(request, response) {
      const input = await readJson(request);
      if (
        typeof input?.email !== 'string' ||
        typeof input?.password !== 'string' ||
        input.password.length > 128
      ) {
        fail(400, 'Email and password are required.');
      }
      checkLoginLimit(request.socket.remoteAddress);
      const user = users.findByEmail(input.email.trim().toLowerCase());
      if (!user?.active || !(await checkPassword(input.password, user.password_hash))) {
        fail(401, 'Incorrect email or password.');
      }
      sendJson(
        response,
        200,
        { user: toPublicUser(user) },
        {
          'Set-Cookie': sessions.create(user.id),
        },
      );
    },
    logout(request, response, { token }) {
      sendJson(
        response,
        200,
        { message: 'Logged out.' },
        {
          'Set-Cookie': sessions.revoke(token),
        },
      );
    },
  };
}
