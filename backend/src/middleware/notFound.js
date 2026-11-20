const { notFound } = require('../utils/AppError');

module.exports = (req, _res, next) =>
  next(notFound(`Route ${req.method} ${req.path} not found.`, 'ROUTE_NOT_FOUND'));
