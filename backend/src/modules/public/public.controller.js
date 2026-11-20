const checkout = require('../orders/checkout.service');
const { ok } = require('../../utils/response');

exports.menu = async (req, res) => ok(res, await checkout.getPublicMenu(req.valid.params.qrToken));

exports.createOrder = async (req, res) => {
  const { created, order } = await checkout.createOrder(req.valid.body);
  // 201 = new order. 200 = the same request was already processed (double click).
  return ok(res, order, created ? 201 : 200);
};

exports.trackOrder = async (req, res) =>
  ok(res, await checkout.getTrackedOrder(req.valid.params.orderToken));
