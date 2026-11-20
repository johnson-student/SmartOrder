const service = require('./categories.service');
const { ok } = require('../../utils/response');

exports.list = async (req, res) => ok(res, await service.list(req.auth.restaurant_id));
exports.create = async (req, res) =>
  ok(res, await service.create(req.auth.restaurant_id, req.valid.body), 201);
exports.update = async (req, res) =>
  ok(res, await service.update(req.auth.restaurant_id, req.valid.params.id, req.valid.body));
exports.remove = async (req, res) =>
  ok(res, await service.deactivate(req.auth.restaurant_id, req.valid.params.id));
