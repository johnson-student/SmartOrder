const { MenuItem, Category } = require('../../models');
const { notFound, badRequest } = require('../../utils/AppError');

const dto = (i) => ({
  item_id: i.item_id,
  category_id: i.category_id,
  name: i.name,
  description: i.description,
  image_url: i.image_url,
  price: i.price, // text such as "12.50"
  is_available: !!i.is_available,
  is_active: !!i.is_active,
});

// Items have no restaurant_id of their own: they belong to a restaurant through their category.
// Every lookup below therefore filters on the category's restaurant_id (tenant isolation).
const scoped = (restaurantId) => ({
  model: Category,
  as: 'category',
  required: true,
  where: { restaurant_id: restaurantId },
  attributes: [],
});

async function assertCategory(restaurantId, categoryId) {
  const category = await Category.findOne({
    where: { category_id: categoryId, restaurant_id: restaurantId },
  });
  if (!category) throw badRequest('That category does not exist.', 'INVALID_CATEGORY');
}

async function list(restaurantId, { category_id } = {}) {
  const rows = await MenuItem.findAll({
    where: category_id ? { category_id } : {},
    include: [scoped(restaurantId)],
    order: [
      ['category_id', 'ASC'],
      ['name', 'ASC'],
    ],
  });
  return rows.map(dto);
}

async function create(restaurantId, values) {
  await assertCategory(restaurantId, values.category_id);
  return dto(await MenuItem.create(values));
}

async function update(restaurantId, id, values) {
  const item = await MenuItem.findOne({ where: { item_id: id }, include: [scoped(restaurantId)] });
  if (!item) throw notFound('Menu item not found.');
  if (values.category_id !== undefined) await assertCategory(restaurantId, values.category_id);
  await item.update(values);
  return dto(item);
}

// "Delete" hides the item; old orders keep their own name/price snapshots.
const deactivate = (restaurantId, id) => update(restaurantId, id, { is_active: false });

module.exports = { list, create, update, deactivate };
