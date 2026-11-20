const router = require('express').Router();
const controller = require('./public.controller');
const schemas = require('./public.schemas');
const validate = require('../../middleware/validate');
const { publicLimiter, orderLimiter } = require('../../middleware/rateLimit');

router.use(publicLimiter);
router.get('/menu/:qrToken', validate({ params: schemas.qrTokenParam }), controller.menu);
router.post(
  '/orders',
  orderLimiter,
  validate({ body: schemas.createOrder }),
  controller.createOrder,
);
router.get(
  '/orders/:orderToken',
  validate({ params: schemas.orderTokenParam }),
  controller.trackOrder,
);

module.exports = router;
