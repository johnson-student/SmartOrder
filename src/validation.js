import { fail } from './http.js';
const roles = ['owner', 'restaurant_staff', 'kitchen_staff'];
export function validateUser(input, { creating = false, admin = false } = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) fail(400, 'Send a JSON object.');
  const allowed = admin
    ? ['name', 'email', 'phone', 'role', 'active', ...(creating ? ['password'] : [])]
    : ['name', 'email', 'phone'];
  for (const key of Object.keys(input))
    if (!allowed.includes(key)) fail(400, `Field '${key}' cannot be changed here.`);
  const result = {};
  for (const key of ['name', 'email', 'phone']) {
    if (creating && key !== 'phone' && input[key] === undefined) fail(400, `${key} is required.`);
    if (input[key] !== undefined) {
      if (typeof input[key] !== 'string') fail(400, `${key} must be text.`);
      result[key] = input[key].trim();
      if (key === 'name' && (result[key].length < 2 || result[key].length > 100))
        fail(400, 'Name must be 2–100 characters.');
      if (key === 'email') {
        result.email = result.email.toLowerCase();
        if (result.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result.email))
          fail(400, 'Enter a valid email.');
      }
      if (key === 'phone' && result.phone && !/^\+?[0-9 ()-]{6,25}$/.test(result.phone))
        fail(400, 'Enter a valid phone number.');
    }
  }
  if (creating) {
    if (
      typeof input.password !== 'string' ||
      input.password.length < 10 ||
      input.password.length > 128
    )
      fail(400, 'Password must be 10–128 characters.');
    result.password = input.password;
  }
  if (input.role !== undefined) {
    if (!roles.includes(input.role)) fail(400, `Role must be ${roles.join(', ')}.`);
    result.role = input.role;
  }
  if (input.active !== undefined) {
    if (typeof input.active !== 'boolean') fail(400, 'active must be true or false.');
    result.active = Number(input.active);
  }
  if (!creating && !Object.keys(result).length) fail(400, 'Provide at least one field to update.');
  return result;
}
