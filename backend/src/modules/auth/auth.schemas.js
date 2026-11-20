const { z } = require('zod');
const { isValidTimeZone } = require('../../utils/dates');

const email = z.string().trim().toLowerCase().email('Enter a valid email address.').max(190);
const password = z
  .string()
  .min(8, 'Password must be at least 8 characters.')
  .max(72, 'Password must be at most 72 characters.');

const register = z.object({
  full_name: z.string().trim().min(1, 'Your name is required.').max(120),
  email,
  password,
  restaurant_name: z.string().trim().min(1, 'Restaurant name is required.').max(120),
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/, 'Currency must be a 3-letter code such as USD.')
    .default('USD'),
  timezone: z
    .string()
    .trim()
    .refine(isValidTimeZone, 'Unknown time zone. Example: Asia/Phnom_Penh')
    .default('Asia/Phnom_Penh'),
});

const login = z.object({
  email,
  password: z.string().min(1, 'Password is required.').max(72),
});

module.exports = { register, login, email, password };
