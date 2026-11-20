const service = require('./orders.service');
const { ok } = require('../../utils/response');

exports.list = async (req, res) => {
  const { orders, meta } = await service.list(req.auth.restaurant_id, req.valid.query);
  return ok(res, orders, 200, meta);
};
exports.get = async (req, res) =>
  ok(res, await service.get(req.auth.restaurant_id, req.valid.params.id));
exports.updateStatus = async (req, res) =>
  ok(res, await service.updateStatus(req.auth, req.valid.params.id, req.valid.body));
