module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    'MenuItem',
    {
      item_id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      category_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      name: { type: DataTypes.STRING(120), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      image_url: { type: DataTypes.STRING(255), allowNull: true },
      // DECIMAL comes back as a string such as "12.50". We convert to cents before any maths.
      price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      is_available: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    { tableName: 'menu_items' },
  );
