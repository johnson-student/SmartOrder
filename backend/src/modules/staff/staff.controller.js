const service = require('./staff.service');
const { ok } = require('../../utils/response');

exports.list = async (req, res) => ok(res, await service.list(req.auth.restaurant_id));
exports.create = async (req, res) => ok(res, await service.create(req.auth, req.valid.body), 201);
exports.update = async (req, res) =>
  ok(res, await service.update(req.auth, req.valid.params.memberId, req.valid.body));
