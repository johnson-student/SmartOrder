'use strict';

/** Creates table `dining_tables`. Raw SQL keeps every constraint from Report v2.0 section 12. */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
CREATE TABLE dining_tables (
  table_id      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  restaurant_id INT UNSIGNED NOT NULL,
  table_number  VARCHAR(20) NOT NULL,
  capacity      INT NULL,
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (table_id),
  UNIQUE KEY uq_table_number (restaurant_id, table_number),
  UNIQUE KEY uq_table_restaurant_id (restaurant_id, table_id),
  CONSTRAINT fk_table_restaurant FOREIGN KEY (restaurant_id)
    REFERENCES restaurants (restaurant_id) ON DELETE RESTRICT,
  CONSTRAINT chk_table_capacity CHECK (capacity IS NULL OR capacity > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('dining_tables');
  },
};
