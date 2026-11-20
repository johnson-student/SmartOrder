const service = require('./reports.service');
const { ok } = require('../../utils/response');

exports.summary = async (req, res) =>
  ok(res, await service.summary(req.auth.restaurant_id, req.valid.query));
