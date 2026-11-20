const QRCode = require('qrcode');
const env = require('../../config/env');
const { sequelize, DiningTable, QrCode } = require('../../models');
const { notFound, conflict } = require('../../utils/AppError');
const { randomToken } = require('../../utils/token');

// The QR image contains this link. The token is random, so it cannot be guessed from a table number.
const menuUrl = (token) => `${env.frontendUrl}/menu/${token}`;

async function toPayload(table, qr) {
  const url = menuUrl(qr.code_value);
  const image = await QRCode.toDataURL(url, { errorCorrectionLevel: 'M', margin: 2, width: 512 });
  return {
    table_id: table.table_id,
    table_number: table.table_number,
    qr_id: qr.qr_id,
    url,
    image, // PNG as a data URL: <img src="..."> or <a download>
    created_at: qr.created_at,
  };
}

// Creates a new random token and revokes the old one, in one transaction.
async function generate(restaurantId, tableId) {
  const { table, qr } = await sequelize.transaction(async (t) => {
    const table = await DiningTable.findOne({
      where: { table_id: tableId, restaurant_id: restaurantId },
      lock: t.LOCK.UPDATE,
      transaction: t,
    });
    if (!table) throw notFound('Table not found.');
    if (!table.is_active)
      throw conflict('Activate this table before creating a QR code.', 'TABLE_INACTIVE');

    await QrCode.update(
      { is_active: false, revoked_at: new Date() },
      { where: { table_id: tableId, is_active: true }, transaction: t },
    );
    const qr = await QrCode.create(
      { table_id: tableId, code_value: randomToken(32) },
      { transaction: t },
    );
    return { table, qr };
  });
  return toPayload(table, qr);
}

async function getActive(restaurantId, tableId) {
  const table = await DiningTable.findOne({
    where: { table_id: tableId, restaurant_id: restaurantId },
  });
  if (!table) throw notFound('Table not found.');
  const qr = await QrCode.findOne({ where: { table_id: tableId, is_active: true } });
  if (!qr) throw notFound('This table has no QR code yet.', 'QR_NOT_FOUND');
  return toPayload(table, qr);
}

module.exports = { generate, getActive, menuUrl };
