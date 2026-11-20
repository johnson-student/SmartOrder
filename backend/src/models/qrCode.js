module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    'QrCode',
    {
      qr_id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      table_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      code_value: { type: DataTypes.STRING(64), allowNull: false, unique: true },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      revoked_at: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: 'qr_codes' },
  );
