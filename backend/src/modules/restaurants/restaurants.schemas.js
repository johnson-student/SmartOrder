const { z } = require('zod');
const { isValidTimeZone } = require('../../utils/dates');

const update = z
  .object({
    name: z.string().trim().min(1, 'Restaurant name is required.').max(120),
    address: z.string().trim().max(255).nullable(),
    phone: z.string().trim().max(30).nullable(),
    currency: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{3}$/, 'Currency must be a 3-letter code such as USD.'),
    timezone: z
      .string()
      .trim()
      .refine(isValidTimeZone, 'Unknown time zone. Example: Asia/Phnom_Penh'),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, 'Send at least one field to update.');

module.exports = { update };
