const list = (value: string | undefined) =>
  (value ?? '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);

export interface ServerConfig {
  databaseUrl: string;
  port: number;
  corsOrigins: string[];
  adminToken: string | undefined;
  clientIpHeader: string | undefined;
  dataBaseUrl: string | undefined;
}

export const readConfig = (env: Record<string, string | undefined> = process.env): ServerConfig => {
  if (!env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  return {
    databaseUrl: env.DATABASE_URL,
    port: Number(env.PORT ?? 3000),
    corsOrigins: list(env.CORS_ORIGINS),
    adminToken: env.ADMIN_TOKEN || undefined,
    clientIpHeader: env.CLIENT_IP_HEADER?.toLowerCase() || undefined,
    dataBaseUrl: env.DATA_BASE_URL?.replace(/\/+$/, '') || undefined
  };
};
