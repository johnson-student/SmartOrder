'use strict';

/** Creates table `categories`. Raw SQL keeps every constraint from Report v2.0 section 12. */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
CREATE TABLE categories (
  category_id   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  restaurant_id INT UNSIGNED NOT NULL,
  name          VARCHAR(80) NOT NULL,
  sort_order    INT NOT NULL DEFAULT 0,
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (category_id),
  UNIQUE KEY uq_category_name (restaurant_id, name),
  KEY idx_category_menu (restaurant_id, is_active, sort_order),
  CONSTRAINT fk_category_restaurant FOREIGN KEY (restaurant_id)
    REFERENCES restaurants (restaurant_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('categories');
  },
};
