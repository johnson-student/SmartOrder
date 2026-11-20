const router = require('express').Router();
const controller = require('./restaurants.controller');
const schemas = require('./restaurants.schemas');
const validate = require('../../middleware/validate');
const authenticate = require('../../middleware/authenticate');
const requireRole = require('../../middleware/requireRole');

router.use(authenticate, requireRole('MANAGER'));
router.get('/', controller.get);
router.put('/', validate({ body: schemas.update }), controller.update);

module.exports = router;
