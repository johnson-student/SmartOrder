'use strict';

const bcrypt = require('bcrypt');
const crypto = require('crypto');

// Demo data for LOCAL DEVELOPMENT ONLY. It refuses to run in production.
// Accounts (password for all: Password123!):
//   owner@demo.test   OWNER      manager@demo.test  MANAGER      staff@demo.test  STAFF
const DEMO_NAME = 'Demo Cafe';
const PASSWORD = 'Password123!';

module.exports = {
  async up(queryInterface) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Refusing to seed demo data in production.');
    }
    const q = queryInterface.sequelize;
    const [existing] = await q.query('SELECT restaurant_id FROM restaurants WHERE name = :n', {
      replacements: { n: DEMO_NAME },
    });
    if (existing.length) {
      console.log('Demo data already exists. Skipping.');
      return;
    }

    const hash = await bcrypt.hash(PASSWORD, 10);
    const now = new Date();
    const t = await q.transaction();
    try {
      const insert = async (table, row) => {
        await queryInterface.bulkInsert(table, [row], { transaction: t });
        const [[{ id }]] = await q.query('SELECT LAST_INSERT_ID() AS id', { transaction: t });
        return id;
      };

      const restaurantId = await insert('restaurants', {
        name: DEMO_NAME,
        address: '12 Riverside Road, Phnom Penh',
        phone: '+855 12 345 678',
        currency: 'USD',
        timezone: 'Asia/Phnom_Penh',
        status: 'ACTIVE',
        next_order_number: 1,
        created_at: now,
      });

      for (const [full_name, email, role] of [
        ['Olivia Owner', 'owner@demo.test', 'OWNER'],
        ['Marcus Manager', 'manager@demo.test', 'MANAGER'],
        ['Sophea Staff', 'staff@demo.test', 'STAFF'],
      ]) {
        const userId = await insert('users', {
          full_name,
          email,
          password_hash: hash,
          created_at: now,
        });
        await insert('restaurant_members', {
          restaurant_id: restaurantId,
          user_id: userId,
          role,
          is_active: 1,
          joined_at: now,
        });
      }

      const menu = {
        Coffee: [
          ['Iced Latte', 'Espresso, cold milk, ice', '3.50'],
          ['Cappuccino', 'Double espresso, steamed milk foam', '3.25'],
          ['Cambodian Iced Coffee', 'Strong drip coffee with condensed milk', '2.75'],
        ],
        Mains: [
          ['Fish Amok', 'Steamed fish curry in banana leaf with rice', '7.50'],
          ['Beef Lok Lak', 'Stir-fried beef, lime-pepper dip, fried egg', '8.00'],
          ['Vegetable Fried Rice', 'Wok-fried rice with seasonal vegetables', '4.50'],
        ],
        Desserts: [
          ['Mango Sticky Rice', 'Sweet coconut rice with ripe mango', '3.75'],
          ['Num Ansom', 'Sticky rice cake with banana, steamed in banana leaf', '2.50'],
        ],
      };
      let order = 0;
      for (const [name, items] of Object.entries(menu)) {
        const categoryId = await insert('categories', {
          restaurant_id: restaurantId,
          name,
          sort_order: order++,
          is_active: 1,
        });
        for (const [itemName, description, price] of items) {
          await insert('menu_items', {
            category_id: categoryId,
            name: itemName,
            description,
            price,
            is_available: 1,
            is_active: 1,
          });
        }
      }

      const frontend = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
      const links = [];
      for (const number of ['1', '2', '3']) {
        const tableId = await insert('dining_tables', {
          restaurant_id: restaurantId,
          table_number: number,
          capacity: 4,
          is_active: 1,
        });
        const token = crypto.randomBytes(32).toString('hex');
        await insert('qr_codes', {
          table_id: tableId,
          code_value: token,
          is_active: 1,
          created_at: now,
        });
        links.push(`  Table ${number}: ${frontend}/menu/${token}`);
      }

      await t.commit();
      console.log('\nDemo data created. Sign in with owner@demo.test / Password123!');
      console.log('Customer menu links (also visible as QR codes in the dashboard):');
      console.log(links.join('\n') + '\n');
    } catch (err) {
      await t.rollback();
      throw err;
    }
  },

  async down(queryInterface) {
    const q = queryInterface.sequelize;
    const [rows] = await q.query('SELECT restaurant_id FROM restaurants WHERE name = :n', {
      replacements: { n: DEMO_NAME },
    });
    for (const { restaurant_id: id } of rows) {
      const p = { replacements: { id } };
      await q.query('DELETE FROM orders WHERE restaurant_id = :id', p);
      await q.query(
        'DELETE FROM qr_codes WHERE table_id IN (SELECT table_id FROM dining_tables WHERE restaurant_id = :id)',
        p,
      );
      await q.query(
        'DELETE FROM menu_items WHERE category_id IN (SELECT category_id FROM categories WHERE restaurant_id = :id)',
        p,
      );
      await q.query('DELETE FROM categories WHERE restaurant_id = :id', p);
      await q.query('DELETE FROM dining_tables WHERE restaurant_id = :id', p);
      await q.query(
        'DELETE FROM users WHERE user_id IN (SELECT user_id FROM restaurant_members WHERE restaurant_id = :id)',
        p,
      );
      await q.query('DELETE FROM restaurants WHERE restaurant_id = :id', p);
    }
  },
};
