const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Restaurant = require('./restaurant')(sequelize, DataTypes);
const User = require('./user')(sequelize, DataTypes);
const RestaurantMember = require('./restaurantMember')(sequelize, DataTypes);
const DiningTable = require('./diningTable')(sequelize, DataTypes);
const QrCode = require('./qrCode')(sequelize, DataTypes);
const Category = require('./category')(sequelize, DataTypes);
const MenuItem = require('./menuItem')(sequelize, DataTypes);
const Order = require('./order')(sequelize, DataTypes);
const OrderItem = require('./orderItem')(sequelize, DataTypes);
const OrderStatusHistory = require('./orderStatusHistory')(sequelize, DataTypes);

// constraints:false -> the database (migrations) owns all foreign keys, not Sequelize.
const rel = { constraints: false };

Restaurant.hasMany(RestaurantMember, { foreignKey: 'restaurant_id', as: 'members', ...rel });
RestaurantMember.belongsTo(Restaurant, { foreignKey: 'restaurant_id', as: 'restaurant', ...rel });
User.hasMany(RestaurantMember, { foreignKey: 'user_id', as: 'memberships', ...rel });
RestaurantMember.belongsTo(User, { foreignKey: 'user_id', as: 'user', ...rel });

DiningTable.belongsTo(Restaurant, { foreignKey: 'restaurant_id', as: 'restaurant', ...rel });
DiningTable.hasMany(QrCode, { foreignKey: 'table_id', as: 'qr_codes', ...rel });
QrCode.belongsTo(DiningTable, { foreignKey: 'table_id', as: 'table', ...rel });

Category.hasMany(MenuItem, { foreignKey: 'category_id', as: 'items', ...rel });
MenuItem.belongsTo(Category, { foreignKey: 'category_id', as: 'category', ...rel });

Order.belongsTo(Restaurant, { foreignKey: 'restaurant_id', as: 'restaurant', ...rel });
Order.belongsTo(DiningTable, { foreignKey: 'table_id', as: 'table', ...rel });
Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items', ...rel });
OrderItem.belongsTo(Order, { foreignKey: 'order_id', as: 'order', ...rel });
OrderItem.belongsTo(MenuItem, { foreignKey: 'item_id', as: 'menu_item', ...rel });
Order.hasMany(OrderStatusHistory, { foreignKey: 'order_id', as: 'history', ...rel });
OrderStatusHistory.belongsTo(User, { foreignKey: 'changed_by', as: 'changed_by_user', ...rel });

module.exports = {
  sequelize,
  Restaurant,
  User,
  RestaurantMember,
  DiningTable,
  QrCode,
  Category,
  MenuItem,
  Order,
  OrderItem,
  OrderStatusHistory,
};
