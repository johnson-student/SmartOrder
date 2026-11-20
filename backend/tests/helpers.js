const request = require('supertest');
const app = require('../src/app');
const { sequelize } = require('../src/models');

const api = () => request(app);
const bearer = (token) => ({ Authorization: `Bearer ${token}` });
let counter = 0;

async function resetDb() {
  for (const table of [
    'order_status_history',
    'order_items',
    'orders',
    'qr_codes',
    'menu_items',
    'categories',
    'dining_tables',
    'restaurant_members',
    'users',
    'restaurants',
  ]) {
    await sequelize.query(`DELETE FROM ${table}`);
  }
}

async function registerOwner(label = 'Cafe') {
  counter += 1;
  const email = `owner${counter}@test.dev`;
  const res = await api()
    .post('/api/v1/auth/register')
    .send({
      full_name: `Owner ${counter}`,
      email,
      password: 'Password123!',
      restaurant_name: `${label} ${counter}`,
    });
  if (res.status !== 201) throw new Error(`register failed: ${JSON.stringify(res.body)}`);
  return { token: res.body.data.token, email, restaurant: res.body.data.restaurant };
}

// Owner creates a Manager/Staff account, then that person signs in.
async function addMember(ownerToken, role) {
  counter += 1;
  const email = `${role.toLowerCase()}${counter}@test.dev`;
  const created = await api()
    .post('/api/v1/staff')
    .set(bearer(ownerToken))
    .send({ full_name: `${role} ${counter}`, email, password: 'Password123!', role });
  if (created.status !== 201) throw new Error(`addMember failed: ${JSON.stringify(created.body)}`);
  const login = await api().post('/api/v1/auth/login').send({ email, password: 'Password123!' });
  return { token: login.body.data.token, member_id: created.body.data.member_id, email };
}

// One category, two items, one table with a QR code.
async function setupRestaurant(ownerToken) {
  const auth = bearer(ownerToken);
  const category = (await api().post('/api/v1/categories').set(auth).send({ name: 'Drinks' })).body
    .data;
  const latte = (
    await api()
      .post('/api/v1/menu-items')
      .set(auth)
      .send({ category_id: category.category_id, name: 'Latte', price: 3.5 })
  ).body.data;
  const amok = (
    await api()
      .post('/api/v1/menu-items')
      .set(auth)
      .send({ category_id: category.category_id, name: 'Fish Amok', price: '7.50' })
  ).body.data;
  const table = (
    await api().post('/api/v1/tables').set(auth).send({ table_number: '1', capacity: 4 })
  ).body.data;
  const qr = (await api().post(`/api/v1/tables/${table.table_id}/qr`).set(auth)).body.data;
  return { category, latte, amok, table, qr, qrToken: qr.url.split('/').pop() };
}

module.exports = { api, bearer, resetDb, registerOwner, addMember, setupRestaurant, sequelize };
