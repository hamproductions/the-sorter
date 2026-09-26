import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './database/schema';

export const createDb = (url: string) => drizzle(url, { schema });

export type DB = ReturnType<typeof createDb>;
