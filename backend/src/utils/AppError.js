// An error we expect and know how to explain to the client.
class AppError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const badRequest = (message, code = 'BAD_REQUEST', details) =>
  new AppError(400, code, message, details);
const unauthorized = (message = 'Please sign in.', code = 'UNAUTHENTICATED') =>
  new AppError(401, code, message);
const forbidden = (message = 'You are not allowed to do this.', code = 'FORBIDDEN') =>
  new AppError(403, code, message);
const notFound = (message = 'Not found.', code = 'NOT_FOUND') => new AppError(404, code, message);
const conflict = (message, code = 'CONFLICT') => new AppError(409, code, message);
const unprocessable = (message, code, details) => new AppError(422, code, message, details);

// Turns a MySQL "duplicate value" error into a friendly 409.
function rethrowUnique(err, code, message) {
  if (err && err.name === 'SequelizeUniqueConstraintError') throw conflict(message, code);
  throw err;
}

module.exports = {
  AppError,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  unprocessable,
  rethrowUnique,
};
