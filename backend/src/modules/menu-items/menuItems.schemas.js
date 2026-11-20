const { z } = require('zod');
const { inputToCents, formatCents } = require('../../utils/money');

const idParam = z.object({ id: z.coerce.number().int().positive() });

// Accepts 12.5 or "12.50". Stored as the exact text "12.50".
const price = z.union([z.number(), z.string()]).transform((value, ctx) => {
  const cents = inputToCents(value);
  if (cents === null) {
    ctx.addIssue({ code: 'custom', message: 'Price must be 0 or more with at most 2 decimals.' });
    return z.NEVER;
  }
  return formatCents(cents);
});

const imageUrl = z
  .string()
  .trim()
  .max(255)
  .refine((v) => /^https?:\/\//i.test(v), 'Image must be an http(s) link.')
  .nullable();

const fields = {
  category_id: z.number().int().positive(),
  name: z.string().trim().min(1, 'Item name is required.').max(120),
  description: z.string().trim().max(2000).nullable(),
  image_url: imageUrl,
  price,
  is_available: z.boolean(),
  is_active: z.boolean(),
};

const create = z.object({
  category_id: fields.category_id,
  name: fields.name,
  price: fields.price,
  description: fields.description.default(null),
  image_url: fields.image_url.default(null),
  is_available: fields.is_available.default(true),
});

const update = z
  .object(fields)
  .partial()
  .refine((v) => Object.keys(v).length > 0, 'Send at least one field to update.');

const listQuery = z.object({ category_id: z.coerce.number().int().positive().optional() });

module.exports = { idParam, create, update, listQuery };
