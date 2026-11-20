module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    'RestaurantMember',
    {
      member_id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      restaurant_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      role: { type: DataTypes.ENUM('OWNER', 'MANAGER', 'STAFF'), allowNull: false },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      joined_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    { tableName: 'restaurant_members' },
  );
