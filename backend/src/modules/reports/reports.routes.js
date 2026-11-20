const router = require('express').Router();
const controller = require('./reports.controller');
const schemas = require('./reports.schemas');
const validate = require('../../middleware/validate');
const authenticate = require('../../middleware/authenticate');
const requireRole = require('../../middleware/requireRole');

router.use(authenticate, requireRole('MANAGER'));
router.get('/summary', validate({ query: schemas.summaryQuery }), controller.summary);

module.exports = router;
