module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    'DiningTable',
    {
      table_id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      restaurant_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      table_number: { type: DataTypes.STRING(20), allowNull: false },
      capacity: { type: DataTypes.INTEGER, allowNull: true },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    { tableName: 'dining_tables' },
  );
