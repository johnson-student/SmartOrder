'use strict';

/** Creates table `restaurants`. Raw SQL keeps every constraint from Report v2.0 section 12. */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
CREATE TABLE restaurants (
  restaurant_id     INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name              VARCHAR(120) NOT NULL,
  address           VARCHAR(255) NULL,
  phone             VARCHAR(30) NULL,
  currency          CHAR(3) NOT NULL DEFAULT 'USD',
  timezone          VARCHAR(50) NOT NULL DEFAULT 'Asia/Phnom_Penh',
  status            ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  next_order_number INT NOT NULL DEFAULT 1,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (restaurant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('restaurants');
  },
};
