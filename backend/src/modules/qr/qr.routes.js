const router = require('express').Router();
const controller = require('./qr.controller');
const { idParam } = require('../tables/tables.schemas');
const validate = require('../../middleware/validate');
const authenticate = require('../../middleware/authenticate');
const requireRole = require('../../middleware/requireRole');

// Mounted under /tables
router.use(authenticate, requireRole('MANAGER'));
router.post('/:id/qr', validate({ params: idParam }), controller.generate);
router.get('/:id/qr', validate({ params: idParam }), controller.get);

module.exports = router;
