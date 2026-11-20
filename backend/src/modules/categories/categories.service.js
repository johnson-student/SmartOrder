const { Category } = require('../../models');
const { notFound, rethrowUnique } = require('../../utils/AppError');

const DUPLICATE = ['CATEGORY_NAME_TAKEN', 'A category with this name already exists.'];

const dto = (c) => ({
  category_id: c.category_id,
  name: c.name,
  sort_order: c.sort_order,
  is_active: !!c.is_active,
});

async function list(restaurantId) {
  const rows = await Category.findAll({
    where: { restaurant_id: restaurantId },
    order: [
      ['sort_order', 'ASC'],
      ['name', 'ASC'],
    ],
  });
  return rows.map(dto);
}

async function create(restaurantId, values) {
  try {
    return dto(await Category.create({ ...values, restaurant_id: restaurantId }));
  } catch (err) {
    return rethrowUnique(err, ...DUPLICATE);
  }
}

async function update(restaurantId, id, values) {
  const category = await Category.findOne({
    where: { category_id: id, restaurant_id: restaurantId },
  });
  if (!category) throw notFound('Category not found.');
  try {
    await category.update(values);
  } catch (err) {
    return rethrowUnique(err, ...DUPLICATE);
  }
  return dto(category);
}

// "Delete" only hides the category (history and old orders stay intact).
const deactivate = (restaurantId, id) => update(restaurantId, id, { is_active: false });

module.exports = { list, create, update, deactivate };
