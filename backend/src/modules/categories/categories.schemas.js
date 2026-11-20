const { z } = require('zod');

const idParam = z.object({ id: z.coerce.number().int().positive() });
const name = z.string().trim().min(1, 'Category name is required.').max(80);

const create = z.object({
  name,
  sort_order: z.number().int().min(0).max(100000).default(0),
});

const update = z
  .object({
    name,
    sort_order: z.number().int().min(0).max(100000),
    is_active: z.boolean(),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, 'Send at least one field to update.');

module.exports = { idParam, create, update };
