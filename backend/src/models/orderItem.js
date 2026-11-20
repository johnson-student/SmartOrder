module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    'OrderItem',
    {
      order_item_id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      order_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      item_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      item_name_snapshot: { type: DataTypes.STRING(120), allowNull: false },
      quantity: { type: DataTypes.INTEGER, allowNull: false },
      unit_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      line_total: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      notes: { type: DataTypes.STRING(255), allowNull: true },
    },
    { tableName: 'order_items' },
  );
