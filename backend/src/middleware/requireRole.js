const { forbidden } = require('../utils/AppError');

const RANK = { STAFF: 1, MANAGER: 2, OWNER: 3 };

// requireRole('MANAGER') means "Manager or Owner". Must run after authenticate().
module.exports = (minRole) => (req, _res, next) => {
  const role = req.auth && req.auth.role;
  if (!role || RANK[role] < RANK[minRole]) {
    return next(forbidden('Your role does not allow this action.'));
  }
  next();
};
