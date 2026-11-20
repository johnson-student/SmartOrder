const service = require('./restaurants.service');
const { ok } = require('../../utils/response');

// The restaurant ID always comes from the signed-in user's membership, never from the request.
exports.get = async (req, res) => ok(res, await service.get(req.auth.restaurant_id));
exports.update = async (req, res) =>
  ok(res, await service.update(req.auth.restaurant_id, req.valid.body));
