'use strict';

/** Creates table `users`. Raw SQL keeps every constraint from Report v2.0 section 12. */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
CREATE TABLE users (
  user_id       INT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name     VARCHAR(120) NOT NULL,
  email         VARCHAR(190) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('users');
  },
};
