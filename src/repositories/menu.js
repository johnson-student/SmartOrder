export function toPublicItem(item) {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    category: item.category,
    price: item.price_cents / 100,
    imageUrl: item.image_url,
    available: Boolean(item.available),
    active: Boolean(item.active),
  };
}

export function createMenuRepository(db) {
  const findById = (id) => db.prepare('SELECT * FROM menu_items WHERE id = ?').get(id);
  const columns = {
    name: 'name',
    description: 'description',
    category: 'category',
    price_cents: 'price_cents',
    imageUrl: 'image_url',
    available: 'available',
    active: 'active',
  };
  return {
    findById,
    // Customers only see active items; owners can list everything.
    list({ includeInactive = false, search = '', category = '' } = {}) {
      const like = `%${search.replace(/[\\%_]/g, '\\$&')}%`;
      return db
        .prepare(
          `SELECT * FROM menu_items
           WHERE (? = 1 OR active = 1)
             AND (name LIKE ? ESCAPE '\\' OR description LIKE ? ESCAPE '\\')
             AND (? = '' OR category = ? COLLATE NOCASE)
           ORDER BY category, name`,
        )
        .all(Number(includeInactive), like, like, category, category);
    },
    findMany(ids) {
      return ids.map(findById).filter(Boolean);
    },
    create({
      name,
      description = '',
      category,
      price_cents,
      imageUrl = '',
      available = 1,
      active = 1,
    }) {
      const result = db
        .prepare(
          `INSERT INTO menu_items (name, description, category, price_cents, image_url, available, active)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(name, description, category, price_cents, imageUrl, available, active);
      return findById(Number(result.lastInsertRowid));
    },
    update(id, changes) {
      // Column names come only from this allowlist; values remain bound parameters.
      const keys = Object.keys(changes);
      if (!keys.length || keys.some((key) => !columns[key]))
        throw new Error('Invalid menu update fields.');
      const assignments = keys.map((key) => `${columns[key]} = ?`).join(', ');
      db.prepare(`UPDATE menu_items SET ${assignments} WHERE id = ?`).run(
        ...keys.map((key) => changes[key]),
        id,
      );
      return findById(id);
    },
    remove: (id) => db.prepare('DELETE FROM menu_items WHERE id = ?').run(id),
  };
}