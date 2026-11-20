module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    'Category',
    {
      category_id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      restaurant_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      name: { type: DataTypes.STRING(80), allowNull: false },
      sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    { tableName: 'categories' },
  );
