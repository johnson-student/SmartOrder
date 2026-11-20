const { AppError } = require('../utils/AppError');
const env = require('../config/env');

// The ONE place where errors become JSON. Shape: { success:false, error:{ code, message } }.
module.exports = (err, req, res, _next) => {
  let status = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'Something went wrong on our side. Please try again.';
  let details;

  if (err instanceof AppError) {
    ({ status, code, message, details } = err);
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    code = 'INVALID_JSON';
    message = 'The request body is not valid JSON.';
  } else if (err.type === 'entity.too.large') {
    status = 413;
    code = 'PAYLOAD_TOO_LARGE';
    message = 'The request body is too large.';
  } else if (err.name === 'SequelizeUniqueConstraintError') {
    status = 409;
    code = 'CONFLICT';
    message = 'That value already exists.';
  } else if (err.name === 'SequelizeForeignKeyConstraintError') {
    status = 409;
    code = 'CONFLICT';
    message = 'This record is linked to other data and cannot be changed this way.';
  } else if (err.name === 'SequelizeDatabaseError' && /check constraint/i.test(err.message)) {
    status = 400;
    code = 'CONSTRAINT_VIOLATION';
    message = 'The data breaks a database rule.';
  }

  if (status >= 500 && !env.isTest) {
    // Log the error, but never request bodies, passwords or tokens.
    console.error(`[error] ${req.method} ${req.originalUrl.split('?')[0]}`, err);
  }

  const body = { success: false, error: { code, message } };
  if (details !== undefined) body.error.details = details;
  res.status(status).json(body);
};
