const router = require('express').Router();
const controller = require('./orders.controller');
const schemas = require('./orders.schemas');
const validate = require('../../middleware/validate');
const authenticate = require('../../middleware/authenticate');
const requireRole = require('../../middleware/requireRole');

router.use(authenticate, requireRole('STAFF')); // Staff, Manager and Owner
router.get('/', validate({ query: schemas.listQuery }), controller.list);
router.get('/:id', validate({ params: schemas.idParam }), controller.get);
router.patch(
  '/:id/status',
  validate({ params: schemas.idParam, body: schemas.updateStatus }),
  controller.updateStatus,
);

module.exports = router;
