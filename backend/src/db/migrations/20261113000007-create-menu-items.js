'use strict';

/** Creates table `menu_items`. Raw SQL keeps every constraint from Report v2.0 section 12. */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
CREATE TABLE menu_items (
  item_id      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  category_id  INT UNSIGNED NOT NULL,
  name         VARCHAR(120) NOT NULL,
  description  TEXT NULL,
  image_url    VARCHAR(255) NULL,
  price        DECIMAL(10,2) NOT NULL,
  is_available TINYINT(1) NOT NULL DEFAULT 1,
  is_active    TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (item_id),
  KEY idx_item_category (category_id, is_active, is_available),
  CONSTRAINT fk_item_category FOREIGN KEY (category_id)
    REFERENCES categories (category_id) ON DELETE RESTRICT,
  CONSTRAINT chk_item_price CHECK (price >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('menu_items');
  },
};
