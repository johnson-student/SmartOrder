const { z } = require('zod');
const { email, password } = require('../auth/auth.schemas');

const idParam = z.object({ memberId: z.coerce.number().int().positive() });

const create = z.object({
  full_name: z.string().trim().min(1, 'Name is required.').max(120),
  email,
  password,
  role: z.enum(['MANAGER', 'STAFF']).default('STAFF'),
});

const update = z
  .object({
    role: z.enum(['MANAGER', 'STAFF']),
    is_active: z.boolean(),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, 'Send role or is_active.');

module.exports = { idParam, create, update };
