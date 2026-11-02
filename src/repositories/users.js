export function toPublicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    active: Boolean(user.active),
    createdAt: user.created_at,
  };
}

export function createUserRepository(db) {
  const findById = (id) => db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  return {
    findById,
    findByEmail: (email) => db.prepare('SELECT * FROM users WHERE email = ?').get(email),
    count: () => db.prepare('SELECT COUNT(*) AS count FROM users').get().count,
    countActiveOwners: () =>
      db.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'owner' AND active = 1").get()
        .count,
    list: () => db.prepare('SELECT * FROM users ORDER BY id').all(),
    create({ name, email, phone = '', role = 'restaurant_staff', active = 1 }, passwordHash) {
      const result = db
        .prepare(
          `
        INSERT INTO users (name, email, phone, password_hash, role, active)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
        )
        .run(name, email, phone, passwordHash, role, active);
      return findById(Number(result.lastInsertRowid));
    },
    update(id, changes) {
      // Column names come only from this allowlist; values remain bound parameters.
      const allowedFields = ['name', 'email', 'phone', 'role', 'active'];
      const fields = Object.keys(changes);
      if (!fields.length || fields.some((field) => !allowedFields.includes(field))) {
        throw new Error('Invalid account update fields.');
      }
      const assignments = fields.map((field) => `${field} = ?`).join(', ');
      db.prepare(`UPDATE users SET ${assignments} WHERE id = ?`).run(
        ...fields.map((field) => changes[field]),
        id,
      );
      return findById(id);
    },
  };
}
