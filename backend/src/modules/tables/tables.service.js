const { DiningTable, QrCode } = require('../../models');
const { notFound, rethrowUnique } = require('../../utils/AppError');

const DUPLICATE = ['TABLE_NUMBER_TAKEN', 'A table with this number already exists.'];

const dto = (t) => ({
  table_id: t.table_id,
  table_number: t.table_number,
  capacity: t.capacity,
  is_active: !!t.is_active,
  has_active_qr: Array.isArray(t.qr_codes) ? t.qr_codes.length > 0 : undefined,
});

async function list(restaurantId) {
  const rows = await DiningTable.findAll({
    where: { restaurant_id: restaurantId },
    include: [
      {
        model: QrCode,
        as: 'qr_codes',
        required: false,
        where: { is_active: true },
        attributes: ['qr_id'],
      },
    ],
    order: [['table_id', 'ASC']],
  });
  return rows
    .map(dto)
    .sort((a, b) => a.table_number.localeCompare(b.table_number, undefined, { numeric: true }));
}

async function create(restaurantId, values) {
  try {
    const table = await DiningTable.create({ ...values, restaurant_id: restaurantId });
    return { ...dto(table), has_active_qr: false };
  } catch (err) {
    return rethrowUnique(err, ...DUPLICATE);
  }
}

async function update(restaurantId, id, values) {
  const table = await DiningTable.findOne({ where: { table_id: id, restaurant_id: restaurantId } });
  if (!table) throw notFound('Table not found.');
  try {
    await table.update(values);
  } catch (err) {
    return rethrowUnique(err, ...DUPLICATE);
  }
  return dto(table);
}

// An inactive table cannot receive orders (its QR code stops working for customers).
const deactivate = (restaurantId, id) => update(restaurantId, id, { is_active: false });

module.exports = { list, create, update, deactivate };
