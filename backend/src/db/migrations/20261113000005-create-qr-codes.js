'use strict';

/** Creates table `qr_codes`. Raw SQL keeps every constraint from Report v2.0 section 12. */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
CREATE TABLE qr_codes (
  qr_id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  table_id        INT UNSIGNED NOT NULL,
  code_value      VARCHAR(64) NOT NULL,
  is_active       TINYINT(1) NOT NULL DEFAULT 1,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at      DATETIME NULL,
  -- NULL when revoked. A UNIQUE index on it means: at most one active QR per table.
  active_table_id INT UNSIGNED GENERATED ALWAYS AS (IF(is_active = 1, table_id, NULL)) VIRTUAL,
  PRIMARY KEY (qr_id),
  UNIQUE KEY uq_qr_code_value (code_value),
  UNIQUE KEY uq_qr_one_active_per_table (active_table_id),
  KEY idx_qr_table (table_id),
  CONSTRAINT fk_qr_table FOREIGN KEY (table_id)
    REFERENCES dining_tables (table_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('qr_codes');
  },
};
