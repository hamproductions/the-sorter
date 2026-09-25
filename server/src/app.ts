import { cors } from '@elysiajs/cors';
import { Elysia, t } from 'elysia';
import { rateLimit } from 'elysia-rate-limit';
import { ADMIN_PAGE } from './admin-page';
import type { DB } from './db';
import type { ServerConfig } from './env';
import type { DataStore } from './lib/data';
import { canonicalizeFilter, normalizeIds } from './lib/filters';
import { safeEqual } from './lib/hash';
import { IpHasher, clientIp } from './lib/ip';
import { parsePeriod } from './lib/period';
import { logger } from './logger';
import { DumpService } from './services/dumps';
import { LeaderboardService, type LeaderboardScope, ScopeError } from './services/leaderboard';
import { type Failure, SubmissionService, UUID, isKind, isModeOf } from './services/submissions';
import type { LeaderboardView } from '~/types/global-ranking';

const VIEWS: LeaderboardView[] = ['global', 'cohort', 'subset'];
const MAX_RANKING_ITEMS = 2000;

const isFailure = (value: unknown): value is Failure =>
  !!value && typeof value === 'object' && 'code' in value && 'error' in value;

const scopeQuery = t.Object({
  kind: t.String(),
  mode: t.Optional(t.String()),
  period: t.Optional(t.String()),
  view: t.Optional(t.String()),
  filter: t.Optional(t.String()),
  performanceIds: t.Optional(t.String())
});

type ScopeQuery = typeof scopeQuery.static;

export interface AppDeps {
  db: DB;
  data: DataStore;
  config: Pick<ServerConfig, 'corsOrigins' | 'adminToken' | 'clientIpHeader'>;
  now?: () => Date;
  rateLimitMax?: number;
}

export const createServices = ({ db, data, now }: Pick<AppDeps, 'db' | 'data' | 'now'>) => {
  const hasher = new IpHasher(db);
  const leaderboard = new LeaderboardService(db, data, now);
  const submissions = new SubmissionService(db, data, hasher, leaderboard, now);
  const dumps = new DumpService(db);
  return { hasher, leaderboard, submissions, dumps };
};

const parseScope = (query: ScopeQuery): LeaderboardScope | string => {
  if (!isKind(query.kind)) return 'invalid_kind';
  const kind = query.kind;
  if (query.mode !== undefined && !isModeOf(kind, query.mode)) return 'invalid_mode';
  const range = parsePeriod(query.period ?? 'all');
  if (!range) return 'invalid_period';
  const view = (query.view ?? 'global') as LeaderboardView;
  if (!VIEWS.includes(view)) return 'invalid_view';
  let rawFilter: unknown = null;
  if (query.filter) {
    try {
      rawFilter = JSON.parse(query.filter);
    } catch {
      return 'invalid_filter';
    }
  }
  const filter = canonicalizeFilter(kind, rawFilter);
  if (!filter) return 'invalid_filter';
  const performanceIds = normalizeIds(
    (query.performanceIds ?? '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean)
  );
  return {
    kind,
    mode: query.mode as LeaderboardScope['mode'],
    range,
    view,
    filter,
    performanceIds
  };
};

const isRanking = (value: unknown): value is string[][] =>
  Array.isArray(value) &&
  value.every(
    (g) => Array.isArray(g) && g.every((id) => typeof id === 'string' && id.length <= 64)
  ) &&
  value.reduce((total: number, g: string[]) => total + g.length, 0) <= MAX_RANKING_ITEMS;

export const createApp = (deps: AppDeps) => {
  const { db, config } = deps;
  const services = createServices(deps);
  const { leaderboard, submissions, dumps } = services;

  const ipOf = (
    request: Request,
    server: { requestIP: (r: Request) => { address: string } | null } | null
  ) =>
    clientIp(
      Object.fromEntries(request.headers.entries()),
      server?.requestIP(request)?.address,
      config.clientIpHeader
    );

  const app = new Elysia()
    .use(
      cors({
        origin: config.corsOrigins.length > 0 ? config.corsOrigins : false,
        methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: false,
        maxAge: 600
      })
    )
    .use(
      rateLimit({
        duration: 60_000,
        max: deps.rateLimitMax ?? 120,
        scoping: 'global',
        generator: (request, server) => ipOf(request, server),
        errorResponse: new Response(JSON.stringify({ error: 'rate_limited' }), {
          status: 429,
          headers: { 'Content-Type': 'application/json' }
        })
      })
    )
    .onError(({ code, error, set }) => {
      if (code === 'VALIDATION') {
        set.status = 422;
        return { error: 'invalid_request' };
      }
      if (code === 'NOT_FOUND') {
        set.status = 404;
        return { error: 'not_found' };
      }
      if (error instanceof ScopeError) {
        set.status = 400;
        return { error: error.message };
      }
      logger.error({ err: error }, 'Unhandled error');
      set.status = 500;
      return { error: 'internal' };
    })
    .get('/health', async () => {
      await db.execute('select 1');
      return { status: 'ok' };
    })
    .post(
      '/tickets',
      async ({ body, request, server, status }) => {
        const result = await submissions.issueTicket(body.kind, ipOf(request, server));
        return isFailure(result) ? status(result.code, { error: result.error }) : result;
      },
      { body: t.Object({ kind: t.String() }) }
    )
    .post(
      '/submissions',
      async ({ body, request, server, status }) => {
        const result = await submissions.submit(body, ipOf(request, server));
        return isFailure(result) ? status(result.code, { error: result.error }) : result;
      },
      {
        body: t.Object({
          protocol: t.Number(),
          ticket: t.String({ maxLength: 64 }),
          kind: t.String({ maxLength: 32 }),
          mode: t.String({ maxLength: 32 }),
          filter: t.Unknown(),
          performanceIds: t.Optional(t.Unknown()),
          initialOrder: t.Unknown(),
          choices: t.Unknown()
        })
      }
    )
    .delete(
      '/submissions/:id',
      async ({ params, body, status }) => {
        const result = await submissions.withdraw(params.id, body.deleteToken);
        return isFailure(result) ? status(result.code, { error: result.error }) : result;
      },
      { body: t.Object({ deleteToken: t.String({ maxLength: 128 }) }) }
    )
    .get(
      '/leaderboard',
      async ({ query, status }) => {
        const scope = parseScope(query);
        if (typeof scope === 'string') return status(400, { error: scope });
        return leaderboard.leaderboard(scope, query.period ?? 'all');
      },
      { query: scopeQuery }
    )
    .get(
      '/items/:itemId/history',
      async ({ params, query, status }) => {
        const scope = parseScope(query);
        if (typeof scope === 'string') return status(400, { error: scope });
        return { itemId: params.itemId, points: await leaderboard.history(scope, params.itemId) };
      },
      { query: scopeQuery }
    )
    .get(
      '/cohorts',
      async ({ query, status }) => {
        if (!isKind(query.kind)) return status(400, { error: 'invalid_kind' });
        if (query.mode !== undefined && !isModeOf(query.kind, query.mode)) {
          return status(400, { error: 'invalid_mode' });
        }
        return leaderboard.cohorts(query.kind, query.mode, Math.min(query.limit ?? 50, 200));
      },
      {
        query: t.Object({
          kind: t.String(),
          mode: t.Optional(t.String()),
          limit: t.Optional(t.Number({ minimum: 1 }))
        })
      }
    )
    .get('/stats', () => leaderboard.stats())
    .post(
      '/agreement',
      async ({ body, status }) => {
        if (!isKind(body.kind)) return status(400, { error: 'invalid_kind' });
        if (!isModeOf(body.kind, body.mode)) return status(400, { error: 'invalid_mode' });
        if (!isRanking(body.ranking)) return status(400, { error: 'invalid_ranking' });
        const submissionId =
          body.submissionId && UUID.test(body.submissionId) ? body.submissionId : undefined;
        return leaderboard.agreement(body.kind, body.mode, body.ranking, submissionId);
      },
      {
        body: t.Object({
          kind: t.String(),
          mode: t.String(),
          ranking: t.Unknown(),
          submissionId: t.Optional(t.String())
        })
      }
    )
    .get('/dumps/:dataset/:file', async ({ params, status, set }) => {
      const match = /^(all|\d{4}|\d{4}-\d{2})\.(json|csv|ndjson)$/.exec(params.file);
      const range = match ? parsePeriod(match[1]) : undefined;
      if (!match || !range) return status(404, { error: 'not_found' });
      const ext = match[2];
      set.headers['cache-control'] = 'public, max-age=300';
      if (params.dataset === 'rollups' && ext === 'json') return dumps.rollups(range);
      if (params.dataset === 'rollups' && ext === 'csv') {
        set.headers['content-type'] = 'text/csv; charset=utf-8';
        return dumps.rollupsCsv(range);
      }
      if (params.dataset === 'submissions' && (ext === 'ndjson' || ext === 'json')) {
        return new Response(dumps.submissionsStream(range, ext), {
          headers: {
            'content-type':
              ext === 'json' ? 'application/json' : 'application/x-ndjson; charset=utf-8',
            'cache-control': 'public, max-age=300'
          }
        });
      }
      return status(404, { error: 'not_found' });
    })
    .get(
      '/admin',
      () =>
        new Response(ADMIN_PAGE, {
          headers: {
            'content-type': 'text/html; charset=utf-8',
            'content-security-policy':
              "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'"
          }
        })
    )
    .group('/admin', (admin) =>
      admin
        .onBeforeHandle(({ headers, status }) => {
          const token = headers.authorization?.replace(/^Bearer\s+/i, '') ?? '';
          if (!config.adminToken || !token || !safeEqual(token, config.adminToken)) {
            return status(401, { error: 'unauthorized' });
          }
        })
        .get('/reviews', () => submissions.listReviews())
        .post('/reviews/:id/keep', async ({ params, status }) => {
          const result = await submissions.resolveReview(params.id, 'keep');
          return isFailure(result) ? status(result.code, { error: result.error }) : result;
        })
        .delete('/reviews/:id', async ({ params, status }) => {
          const result = await submissions.resolveReview(params.id, 'delete');
          return isFailure(result) ? status(result.code, { error: result.error }) : result;
        })
    );

  return { app, services };
};
