const router = require('express').Router();
const controller = require('./staff.controller');
const schemas = require('./staff.schemas');
const validate = require('../../middleware/validate');
const authenticate = require('../../middleware/authenticate');
const requireRole = require('../../middleware/requireRole');

// Manager+ may enter; the service then limits Managers to Staff-role accounts.
router.use(authenticate, requireRole('MANAGER'));
router.get('/', controller.list);
router.post('/', validate({ body: schemas.create }), controller.create);
router.patch(
  '/:memberId',
  validate({ params: schemas.idParam, body: schemas.update }),
  controller.update,
);

module.exports = router;
