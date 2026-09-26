import { cron } from '@elysiajs/cron';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { createApp } from './app';
import { createDb } from './db';
import { readConfig } from './env';
import { DataStore } from './lib/data';
import { logger } from './logger';

const config = readConfig();
const db = createDb(config.databaseUrl);

await migrate(db, { migrationsFolder: process.env.MIGRATIONS_DIR ?? 'drizzle' });

const data = new DataStore();
const refreshData = async () => {
  if (!config.dataBaseUrl) return;
  try {
    await data.refresh(config.dataBaseUrl);
    logger.info('Data refreshed');
  } catch (err) {
    logger.warn({ err }, 'Data refresh failed, keeping previous data');
  }
};
await refreshData();

const { app, services } = createApp({ db, data, config });

const runJob = (name: string, job: () => Promise<void>) => async () => {
  try {
    await job();
    logger.info(`${name} finished`);
  } catch (err) {
    logger.error({ err }, `${name} failed`);
  }
};

app
  .use(
    cron({
      name: 'purge',
      pattern: '15 * * * *',
      run: runJob('purge', () => services.submissions.purge())
    })
  )
  .use(
    cron({ name: 'refresh-data', pattern: '40 * * * *', run: runJob('refresh-data', refreshData) })
  )
  .use(
    cron({
      name: 'recompute-agreement',
      pattern: '30 4 * * *',
      run: runJob('recompute-agreement', () => services.submissions.recomputeAgreement())
    })
  )
  .listen(config.port, () => {
    logger.info(`Server listening on port ${config.port}`);
    if (!config.clientIpHeader) {
      logger.warn(
        'CLIENT_IP_HEADER is not set: limits use the socket address, so every visitor behind a reverse proxy shares one limit'
      );
    }
  });

const shutdown = async () => {
  await app.stop();
  await db.$client.end();
  process.exit(0);
};
process.on('SIGTERM', () => void shutdown());
process.on('SIGINT', () => void shutdown());
