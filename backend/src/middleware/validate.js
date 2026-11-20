const { badRequest } = require('../utils/AppError');

// validate({ body, query, params }) checks the request with Zod schemas.
// Clean values are stored in req.valid.body / req.valid.query / req.valid.params.
module.exports = (schemas) => (req, _res, next) => {
  req.valid = req.valid || {};
  for (const part of ['params', 'query', 'body']) {
    if (!schemas[part]) continue;
    const result = schemas[part].safeParse(req[part] ?? {});
    if (!result.success) {
      const issues = result.error.issues.map((i) => ({
        field: i.path.join('.') || part,
        message: i.message,
      }));
      return next(badRequest(issues[0].message, 'VALIDATION_ERROR', issues));
    }
    req.valid[part] = result.data;
  }
  next();
};
