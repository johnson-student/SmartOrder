'use strict';

/** Creates table `order_items`. Raw SQL keeps every constraint from Report v2.0 section 12. */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
CREATE TABLE order_items (
  order_item_id      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id           INT UNSIGNED NOT NULL,
  item_id            INT UNSIGNED NOT NULL,
  item_name_snapshot VARCHAR(120) NOT NULL,
  quantity           INT NOT NULL,
  unit_price         DECIMAL(10,2) NOT NULL,
  line_total         DECIMAL(10,2) NOT NULL,
  notes              VARCHAR(255) NULL,
  PRIMARY KEY (order_item_id),
  KEY idx_order_items_order (order_id),
  KEY idx_order_items_item (item_id),
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id)
    REFERENCES orders (order_id) ON DELETE CASCADE,
  CONSTRAINT fk_order_items_item FOREIGN KEY (item_id)
    REFERENCES menu_items (item_id) ON DELETE RESTRICT,
  CONSTRAINT chk_order_items_quantity CHECK (quantity >= 1),
  CONSTRAINT chk_order_items_line_total CHECK (line_total = quantity * unit_price)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('order_items');
  },
};
