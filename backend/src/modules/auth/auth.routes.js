const router = require('express').Router();
const controller = require('./auth.controller');
const schemas = require('./auth.schemas');
const validate = require('../../middleware/validate');
const authenticate = require('../../middleware/authenticate');
const { authLimiter } = require('../../middleware/rateLimit');

router.post('/register', authLimiter, validate({ body: schemas.register }), controller.register);
router.post('/login', authLimiter, validate({ body: schemas.login }), controller.login);
router.get('/me', authenticate, controller.me);

module.exports = router;
