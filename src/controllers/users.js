import { readJson, sendJson, fail } from '../http.js';
import { validateUser } from '../validation.js';
import { hashPassword } from '../security.js';
import { toPublicUser } from '../repositories/users.js';

export function createUserController(users, sessions) {
  function requireOwner(user) {
    if (user.role !== 'owner') fail(403, 'Only owners can manage accounts.');
  }

  return {
    profile(request, response, { user }) {
      sendJson(response, 200, { user: toPublicUser(user) });
    },
    async updateProfile(request, response, { user }) {
      const changes = validateUser(await readJson(request));
      const updatedUser = users.update(user.id, changes);
      sendJson(response, 200, { user: toPublicUser(updatedUser) });
    },
    list(request, response, { user }) {
      requireOwner(user);
      sendJson(response, 200, { users: users.list().map(toPublicUser) });
    },
    async create(request, response, { user }) {
      requireOwner(user);
      const values = validateUser(await readJson(request), { creating: true, admin: true });
      const passwordHash = await hashPassword(values.password);
      const createdUser = users.create(values, passwordHash);
      sendJson(response, 201, { user: toPublicUser(createdUser) });
    },
    async update(request, response, { user }, id) {
      requireOwner(user);
      const target = users.findById(id);
      if (!target) fail(404, 'Account not found.');
      const changes = validateUser(await readJson(request), { admin: true });
      const removesOwner = (changes.role && changes.role !== 'owner') || changes.active === 0;
      if (
        target.role === 'owner' &&
        target.active &&
        removesOwner &&
        users.countActiveOwners() <= 1
      ) {
        fail(409, 'Keep at least one active owner.');
      }
      const updatedUser = users.update(id, changes);
      if (changes.active === 0 || changes.role !== undefined) sessions.revokeForUser(id);
      sendJson(response, 200, { user: toPublicUser(updatedUser) });
    },
  };
}
