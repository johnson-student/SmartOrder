const { z } = require('zod');

const idParam = z.object({ id: z.coerce.number().int().positive() });
const tableNumber = z.string().trim().min(1, 'Table number is required.').max(20);
const capacity = z.number().int().min(1, 'Capacity must be at least 1.').max(1000).nullable();

const create = z.object({ table_number: tableNumber, capacity: capacity.default(null) });

const update = z
  .object({ table_number: tableNumber, capacity, is_active: z.boolean() })
  .partial()
  .refine((v) => Object.keys(v).length > 0, 'Send at least one field to update.');

module.exports = { idParam, create, update };
