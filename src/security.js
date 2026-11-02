import { randomBytes, scrypt, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';

const deriveKey = promisify(scrypt);

export function createToken() {
  return randomBytes(32).toString('hex');
}

export function digest(token) {
  return createHash('sha256').update(token).digest('hex');
}

export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const key = await deriveKey(password, salt, 64);
  return `${salt}:${key.toString('hex')}`;
}

export async function checkPassword(password, storedHash) {
  const [salt, hash] = storedHash.split(':');
  const candidateKey = await deriveKey(password, salt, 64);
  return timingSafeEqual(Buffer.from(hash, 'hex'), candidateKey);
}
