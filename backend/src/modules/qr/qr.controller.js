const service = require('./qr.service');
const { ok } = require('../../utils/response');

exports.generate = async (req, res) =>
  ok(res, await service.generate(req.auth.restaurant_id, req.valid.params.id), 201);
exports.get = async (req, res) =>
  ok(res, await service.getActive(req.auth.restaurant_id, req.valid.params.id));
