const STATUSES = ['PENDING', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'];

module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    'OrderStatusHistory',
    {
      history_id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      order_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      changed_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      old_status: { type: DataTypes.ENUM(...STATUSES), allowNull: true },
      new_status: { type: DataTypes.ENUM(...STATUSES), allowNull: false },
      reason: { type: DataTypes.STRING(255), allowNull: true },
      changed_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    { tableName: 'order_status_history' },
  );
