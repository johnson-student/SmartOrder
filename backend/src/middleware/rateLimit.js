const rateLimit = require('express-rate-limit');
const env = require('../config/env');
const { AppError } = require('../utils/AppError');

const make = (windowMs, limit, message) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: () => env.rateLimitDisabled,
    handler: (_req, _res, next) => next(new AppError(429, 'RATE_LIMITED', message)),
  });

module.exports = {
  // sign in / register: protects against password guessing
  authLimiter: make(15 * 60 * 1000, 20, 'Too many attempts. Please wait a few minutes.'),
  // public menu and order tracking
  publicLimiter: make(60 * 1000, 120, 'Too many requests. Please slow down.'),
  // placing orders
  orderLimiter: make(60 * 1000, 20, 'Too many orders submitted. Please wait a moment.'),
};
