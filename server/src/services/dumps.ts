import { and, asc, eq, gt, gte, lte } from 'drizzle-orm';
import { item_monthly, submissions } from '../database/schema';
import type { DB } from '../db';
import type { PeriodRange } from '../lib/period';

const ROLLUP_COLUMNS = [
  'kind',
  'mode',
  'month',
  'item_id',
  'appearances',
  'percentile_sum',
  'top1',
  'top3',
  'top10'
] as const;

const csvCell = (value: unknown) => {
  const text = String(value ?? '');
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

export class DumpService {
  constructor(private db: DB) {}

  async rollups(range: PeriodRange) {
    return this.db
      .select()
      .from(item_monthly)
      .where(and(gte(item_monthly.month, range.from), lte(item_monthly.month, range.to)))
      .orderBy(item_monthly.month, item_monthly.kind, item_monthly.mode, item_monthly.item_id);
  }

  async rollupsCsv(range: PeriodRange) {
    const rows = await this.rollups(range);
    return [
      ROLLUP_COLUMNS.join(','),
      ...rows.map((row) => ROLLUP_COLUMNS.map((c) => csvCell(row[c])).join(','))
    ].join('\n');
  }

  submissionsStream(range: PeriodRange, format: 'ndjson' | 'json', batchSize = 500) {
    const db = this.db;
    const encoder = new TextEncoder();
    let cursor: string | undefined;
    let first = true;
    let done = false;
    return new ReadableStream<Uint8Array>({
      async pull(controller) {
        if (done) return;
        const rows = await db
          .select({
            id: submissions.id,
            kind: submissions.kind,
            mode: submissions.mode,
            filter: submissions.filter,
            performanceIds: submissions.performance_ids,
            ranking: submissions.ranking,
            itemCount: submissions.item_count,
            createdAt: submissions.created_at
          })
          .from(submissions)
          .where(
            and(
              eq(submissions.status, 'accepted'),
              gte(submissions.month, range.from),
              lte(submissions.month, range.to),
              cursor ? gt(submissions.id, cursor) : undefined
            )
          )
          .orderBy(asc(submissions.id))
          .limit(batchSize);
        let chunk = format === 'json' && first ? '[' : '';
        for (const { id: _id, createdAt, ...row } of rows) {
          const line = JSON.stringify({ ...row, date: createdAt.toISOString().slice(0, 10) });
          chunk += format === 'json' ? `${first ? '' : ','}${line}` : `${line}\n`;
          first = false;
        }
        if (rows.length < batchSize) {
          if (format === 'json') chunk += ']';
          done = true;
          controller.enqueue(encoder.encode(chunk));
          controller.close();
          return;
        }
        cursor = rows[rows.length - 1].id;
        controller.enqueue(encoder.encode(chunk));
      }
    });
  }
}
