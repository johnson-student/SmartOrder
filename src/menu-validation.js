import { fail } from './http.js';

const fields = ['name', 'description', 'category', 'price', 'imageUrl', 'available', 'active'];

export function validateMenuItem(input, { creating = false } = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) fail(400, 'Send a JSON object.');
  for (const key of Object.keys(input))
    if (!fields.includes(key)) fail(400, `Field '${key}' cannot be changed here.`);
  if (creating)
    for (const key of ['name', 'category', 'price'])
      if (input[key] === undefined) fail(400, `${key} is required.`);

  const result = {};
  for (const key of ['name', 'description', 'category', 'imageUrl']) {
    if (input[key] === undefined) continue;
    if (typeof input[key] !== 'string') fail(400, `${key} must be text.`);
    result[key] = input[key].trim();
  }
  if (result.name !== undefined && (result.name.length < 2 || result.name.length > 80))
    fail(400, 'Name must be 2–80 characters.');
  if (result.category !== undefined && (result.category.length < 2 || result.category.length > 40))
    fail(400, 'Category must be 2–40 characters.');
  if (result.description !== undefined && result.description.length > 300)
    fail(400, 'Description must be 300 characters or fewer.');
  if (result.imageUrl) {
    let url;
    try {
      url = new URL(result.imageUrl);
    } catch {}
    if (url?.protocol !== 'https:' || result.imageUrl.length > 500)
      fail(400, 'Image must be a valid https link.');
  }
  if (input.price !== undefined) {
    const cents = Math.round(Number(input.price) * 100);
    if (
      typeof input.price !== 'number' ||
      !Number.isFinite(input.price) ||
      Math.abs(input.price * 100 - cents) > 1e-6 ||
      cents <= 0 ||
      cents > 99999
    )
      fail(400, 'Price must be greater than 0, at most 999.99, with up to 2 decimals.');
    result.price_cents = cents;
  }
  for (const key of ['available', 'active']) {
    if (input[key] === undefined) continue;
    if (typeof input[key] !== 'boolean') fail(400, `${key} must be true or false.`);
    result[key] = Number(input[key]);
  }
  if (!creating && !Object.keys(result).length) fail(400, 'Provide at least one field to update.');
  return result;
}