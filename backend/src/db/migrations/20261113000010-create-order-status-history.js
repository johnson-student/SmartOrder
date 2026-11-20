'use strict';

/** Creates table `order_status_history`. Raw SQL keeps every constraint from Report v2.0 section 12. */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
CREATE TABLE order_status_history (
  history_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id   INT UNSIGNED NOT NULL,
  changed_by INT UNSIGNED NULL,
  old_status ENUM('PENDING','PREPARING','READY','COMPLETED','CANCELLED') NULL,
  new_status ENUM('PENDING','PREPARING','READY','COMPLETED','CANCELLED') NOT NULL,
  reason     VARCHAR(255) NULL,
  changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (history_id),
  KEY idx_history_order (order_id, changed_at),
  KEY idx_history_user (changed_by),
  CONSTRAINT fk_history_order FOREIGN KEY (order_id)
    REFERENCES orders (order_id) ON DELETE CASCADE,
  CONSTRAINT fk_history_user FOREIGN KEY (changed_by)
    REFERENCES users (user_id) ON DELETE SET NULL,
  CONSTRAINT chk_history_cancel_reason CHECK (new_status <> 'CANCELLED' OR reason IS NOT NULL)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('order_status_history');
  },
};
