const router = require('express').Router();
const controller = require('./categories.controller');
const schemas = require('./categories.schemas');
const validate = require('../../middleware/validate');
const authenticate = require('../../middleware/authenticate');
const requireRole = require('../../middleware/requireRole');

router.use(authenticate, requireRole('MANAGER'));
router.get('/', controller.list);
router.post('/', validate({ body: schemas.create }), controller.create);
router.put('/:id', validate({ params: schemas.idParam, body: schemas.update }), controller.update);
router.delete('/:id', validate({ params: schemas.idParam }), controller.remove);

module.exports = router;
