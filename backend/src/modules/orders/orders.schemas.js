const { z } = require('zod');
const { STATUSES } = require('./order.constants');
const { isRealDate } = require('../../utils/dates');

const idParam = z.object({ id: z.coerce.number().int().positive() });
const dateStr = z.string().refine(isRealDate, 'Use a real date in YYYY-MM-DD format.');

const listQuery = z
  .object({
    status: z
      .string()
      .optional()
      .transform((v) => (v ? v.split(',').map((s) => s.trim().toUpperCase()) : undefined))
      .refine((v) => !v || v.every((s) => STATUSES.includes(s)), 'Unknown status.'),
    active: z
      .enum(['true', 'false'])
      .optional()
      .transform((v) => v === 'true'),
    from: dateStr.optional(),
    to: dateStr.optional(),
    sort: z.enum(['asc', 'desc']).default('desc'),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .refine((q) => !q.from || !q.to || q.from <= q.to, 'The "from" date must not be after "to".');

const updateStatus = z
  .object({
    status: z.enum(['PREPARING', 'READY', 'COMPLETED', 'CANCELLED']),
    reason: z.string().trim().max(255).optional(),
  })
  .refine((v) => v.status !== 'CANCELLED' || (v.reason && v.reason.length > 0), {
    message: 'A reason is required to cancel an order.',
    path: ['reason'],
  });

module.exports = { idParam, listQuery, updateStatus };
