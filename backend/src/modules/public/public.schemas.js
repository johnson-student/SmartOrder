const { z } = require('zod');

const qrTokenParam = z.object({ qrToken: z.string().min(1).max(100) });
const orderTokenParam = z.object({ orderToken: z.string().min(1).max(100) });

const line = z.object({
  item_id: z.number().int().positive(),
  quantity: z
    .number()
    .int('Quantity must be a whole number.')
    .min(1, 'Quantity must be at least 1.')
    .max(99, 'Quantity must be 99 or less.'),
  notes: z.string().trim().max(255).optional(),
});

// Note: the customer sends NO prices, totals, table or restaurant. Any extra field is ignored.
const createOrder = z.object({
  qr_token: z.string().min(1).max(100),
  client_request_id: z.string().uuid('client_request_id must be a UUID.'),
  customer_note: z.string().trim().max(255).optional(),
  items: z
    .array(line)
    .min(1, 'Your cart is empty.')
    .max(50, 'You can order at most 50 lines at once.'),
});

module.exports = { qrTokenParam, orderTokenParam, createOrder };
