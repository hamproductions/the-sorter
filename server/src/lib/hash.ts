import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

export const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

export const randomToken = () => randomBytes(32).toString('hex');

export const safeEqual = (a: string, b: string) => {
  const left = Buffer.from(sha256(a));
  const right = Buffer.from(sha256(b));
  return timingSafeEqual(left, right);
};
