const router = require('express').Router();
const controller = require('./menuItems.controller');
const schemas = require('./menuItems.schemas');
const validate = require('../../middleware/validate');
const authenticate = require('../../middleware/authenticate');
const requireRole = require('../../middleware/requireRole');

router.use(authenticate, requireRole('MANAGER'));
router.get('/', validate({ query: schemas.listQuery }), controller.list);
router.post('/', validate({ body: schemas.create }), controller.create);
router.put('/:id', validate({ params: schemas.idParam, body: schemas.update }), controller.update);
router.delete('/:id', validate({ params: schemas.idParam }), controller.remove);

module.exports = router;
