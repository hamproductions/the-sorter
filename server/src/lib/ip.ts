import { eq } from 'drizzle-orm';
import { daily_salts } from '../database/schema';
import type { DB } from '../db';
import { randomToken, sha256 } from './hash';
import { dayOf } from './period';

export const clientIp = (
  headers: Record<string, string | undefined>,
  socketAddress: string | undefined,
  ipHeader: string | undefined
) => {
  if (ipHeader) {
    const value = headers[ipHeader];
    if (value) {
      const parts = value
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean);
      const last = parts.at(-1);
      if (last) return last;
    }
  }
  return socketAddress ?? 'unknown';
};

export class IpHasher {
  private cache: { day: string; salt: string } | undefined;

  constructor(private db: DB) {}

  private async saltFor(day: string) {
    if (this.cache?.day === day) return this.cache.salt;
    await this.db.insert(daily_salts).values({ day, salt: randomToken() }).onConflictDoNothing();
    const [row] = await this.db.select().from(daily_salts).where(eq(daily_salts.day, day));
    this.cache = { day, salt: row.salt };
    return row.salt;
  }

  async hash(ip: string, now = new Date()) {
    const day = dayOf(now);
    return { day, ipHash: sha256(`${await this.saltFor(day)}:${ip}`) };
  }
}
