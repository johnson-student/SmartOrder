module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    'Order',
    {
      order_id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      restaurant_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      table_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      order_number: { type: DataTypes.INTEGER, allowNull: false },
      public_token: { type: DataTypes.CHAR(32), allowNull: false, unique: true },
      client_request_id: { type: DataTypes.CHAR(36), allowNull: true },
      status: {
        type: DataTypes.ENUM('PENDING', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'),
        allowNull: false,
        defaultValue: 'PENDING',
      },
      subtotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      total: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      customer_note: { type: DataTypes.STRING(255), allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    { tableName: 'orders' },
  );
