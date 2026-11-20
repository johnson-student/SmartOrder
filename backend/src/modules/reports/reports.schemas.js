const { z } = require('zod');
const { isRealDate, addDays } = require('../../utils/dates');

const dateStr = z.string().refine(isRealDate, 'Use a real date in YYYY-MM-DD format.');

const summaryQuery = z
  .object({ from: dateStr.optional(), to: dateStr.optional() })
  .refine((q) => !q.from || !q.to || q.from <= q.to, 'The "from" date must not be after "to".')
  .refine(
    (q) => !q.from || !q.to || addDays(q.from, 366) > q.to,
    'Choose a range of at most one year.',
  );

module.exports = { summaryQuery };
