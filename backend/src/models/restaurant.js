module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    'Restaurant',
    {
      restaurant_id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING(120), allowNull: false },
      address: { type: DataTypes.STRING(255), allowNull: true },
      phone: { type: DataTypes.STRING(30), allowNull: true },
      currency: { type: DataTypes.CHAR(3), allowNull: false, defaultValue: 'USD' },
      timezone: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'Asia/Phnom_Penh' },
      status: {
        type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
        allowNull: false,
        defaultValue: 'ACTIVE',
      },
      next_order_number: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    { tableName: 'restaurants' },
  );
