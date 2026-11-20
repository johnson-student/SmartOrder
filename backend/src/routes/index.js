const router = require('express').Router();
const { sequelize } = require('../models');

router.get('/health', async (_req, res) => {
  let db = 'up';
  try {
    await sequelize.authenticate();
  } catch {
    db = 'down';
  }
  res.status(db === 'up' ? 200 : 503).json({
    success: db === 'up',
    data: { status: db === 'up' ? 'ok' : 'degraded', service: 'smartqr-api', db },
  });
});

router.use('/auth', require('../modules/auth/auth.routes'));
router.use('/public', require('../modules/public/public.routes'));
router.use('/orders', require('../modules/orders/orders.routes'));
router.use('/restaurant', require('../modules/restaurants/restaurants.routes'));
router.use('/categories', require('../modules/categories/categories.routes'));
router.use('/menu-items', require('../modules/menu-items/menuItems.routes'));
router.use('/tables', require('../modules/tables/tables.routes'));
router.use('/tables', require('../modules/qr/qr.routes'));
router.use('/staff', require('../modules/staff/staff.routes'));
router.use('/reports', require('../modules/reports/reports.routes'));

module.exports = router;
