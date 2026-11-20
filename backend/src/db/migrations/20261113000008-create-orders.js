'use strict';

/** Creates table `orders`. Raw SQL keeps every constraint from Report v2.0 section 12. */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
CREATE TABLE orders (
  order_id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  restaurant_id     INT UNSIGNED NOT NULL,
  table_id          INT UNSIGNED NOT NULL,
  order_number      INT NOT NULL,
  public_token      CHAR(32) NOT NULL,
  -- Added to the report's design: stops a double-clicked "Submit" from creating two orders.
  client_request_id CHAR(36) NULL,
  status            ENUM('PENDING','PREPARING','READY','COMPLETED','CANCELLED')
                    NOT NULL DEFAULT 'PENDING',
  subtotal          DECIMAL(10,2) NOT NULL,
  total             DECIMAL(10,2) NOT NULL,
  customer_note     VARCHAR(255) NULL,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (order_id),
  UNIQUE KEY uq_order_number (restaurant_id, order_number),
  UNIQUE KEY uq_order_public_token (public_token),
  UNIQUE KEY uq_order_client_request (restaurant_id, client_request_id),
  KEY idx_order_status (restaurant_id, status, created_at),
  KEY idx_order_created (restaurant_id, created_at),
  CONSTRAINT fk_order_restaurant FOREIGN KEY (restaurant_id)
    REFERENCES restaurants (restaurant_id) ON DELETE RESTRICT,
  -- The table must belong to the same restaurant as the order.
  CONSTRAINT fk_order_table_same_restaurant FOREIGN KEY (restaurant_id, table_id)
    REFERENCES dining_tables (restaurant_id, table_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('orders');
  },
};
