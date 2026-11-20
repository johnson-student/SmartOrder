const service = require('./auth.service');
const { ok } = require('../../utils/response');

exports.register = async (req, res) => ok(res, await service.register(req.valid.body), 201);
exports.login = async (req, res) => ok(res, await service.login(req.valid.body));
exports.me = async (req, res) => ok(res, service.profile(req.auth));
