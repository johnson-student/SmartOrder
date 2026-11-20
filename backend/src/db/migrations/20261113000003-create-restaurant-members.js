'use strict';

/** Creates table `restaurant_members`. Raw SQL keeps every constraint from Report v2.0 section 12. */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
CREATE TABLE restaurant_members (
  member_id     INT UNSIGNED NOT NULL AUTO_INCREMENT,
  restaurant_id INT UNSIGNED NOT NULL,
  user_id       INT UNSIGNED NOT NULL,
  role          ENUM('OWNER','MANAGER','STAFF') NOT NULL,
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  joined_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (member_id),
  UNIQUE KEY uq_member_restaurant_user (restaurant_id, user_id),
  KEY idx_member_user (user_id),
  CONSTRAINT fk_member_restaurant FOREIGN KEY (restaurant_id)
    REFERENCES restaurants (restaurant_id) ON DELETE CASCADE,
  CONSTRAINT fk_member_user FOREIGN KEY (user_id)
    REFERENCES users (user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('restaurant_members');
  },
};
