import { readJson, sendJson, fail } from '../http.js';
import { validateMenuItem } from '../menu-validation.js';
import { toPublicItem } from '../repositories/menu.js';

export function createMenuController(menu) {
  function requireOwner(user) {
    if (user.role !== 'owner') fail(403, 'Only owners can manage the menu.');
  }
  const query = (request) => new URL(request.url, 'http://localhost').searchParams;

  return {
    // Public: customers browse and search active items (SCRUM-31, SCRUM-35).
    list(request, response) {
      const params = query(request);
      const items = menu.list({
        search: (params.get('q') || '').trim().slice(0, 80),
        category: (params.get('category') || '').trim().slice(0, 40),
      });
      sendJson(response, 200, { items: items.map(toPublicItem) });
    },
    // Public: item details (SCRUM-33). Inactive items look like they do not exist.
    detail(request, response, id) {
      const item = menu.findById(id);
      if (!item?.active) fail(404, 'Menu item not found.');
      sendJson(response, 200, { item: toPublicItem(item) });
    },
    // Public: revalidate availability before checkout (SCRUM-36).
    async check(request, response) {
      const { ids } = (await readJson(request)) ?? {};
      if (!Array.isArray(ids) || ids.length > 100 || ids.some((id) => !Number.isInteger(id)))
        fail(400, 'Send ids as a list of up to 100 item ids.');
      const found = new Map(menu.findMany(ids).map((item) => [item.id, item]));
      const unavailable = [...new Set(ids)].filter((id) => {
        const item = found.get(id);
        return !item || !item.active || !item.available;
      });
      sendJson(response, 200, { ok: unavailable.length === 0, unavailable });
    },
    // Owner-only management (SCRUM-37).
    manageList(request, response, { user }) {
      requireOwner(user);
      sendJson(response, 200, {
        items: menu.list({ includeInactive: true }).map(toPublicItem),
      });
    },
    async create(request, response, { user }) {
      requireOwner(user);
      const values = validateMenuItem(await readJson(request), { creating: true });
      sendJson(response, 201, { item: toPublicItem(menu.create(values)) });
    },
    async update(request, response, { user }, id) {
      requireOwner(user);
      if (!menu.findById(id)) fail(404, 'Menu item not found.');
      const changes = validateMenuItem(await readJson(request));
      sendJson(response, 200, { item: toPublicItem(menu.update(id, changes)) });
    },
    remove(request, response, { user }, id) {
      requireOwner(user);
      if (!menu.findById(id)) fail(404, 'Menu item not found.');
      menu.remove(id);
      sendJson(response, 200, { removed: true });
    },
  };
}