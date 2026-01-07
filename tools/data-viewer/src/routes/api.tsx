import { Elysia, t } from 'elysia'
import { Html } from '@elysiajs/html'
import { TableCell, KeyValueCell } from '../views/table'
import {
  loadData,
  saveData,
  updateRecord,
  type DataFileName,
} from '../services/data'
import {
  getFileHistory,
  getFileAtCommit,
  computeRecordDiff,
  computeKvDiff,
  type GitCommit,
  type RecordChange,
  type KvChange,
} from '../services/git'

type DataRecord = Record<string, unknown> & { id?: string }

function HistoryList({ commits, filename }: { commits: GitCommit[]; filename: string }) {
  return (
    <div class="history-content">
      <div class="history-controls">
        <button
          id="compare-btn"
          class="outline"
          disabled
          onclick={`
            const checks = document.querySelectorAll('.history-check:checked');
            if (checks.length === 2) {
              const [from, to] = Array.from(checks).map(c => c.value);
              htmx.ajax('GET', '/api/diff/${filename}?from=' + from + '&to=' + to, {target: '#diff-container', swap: 'innerHTML'});
            }
          `}
        >
          Compare Selected
        </button>
        <button
          class="outline secondary"
          onclick={`
            const checks = document.querySelectorAll('.history-check:checked');
            if (checks.length === 1) {
              htmx.ajax('GET', '/api/diff/${filename}?from=' + checks[0].value + '&to=current', {target: '#diff-container', swap: 'innerHTML'});
            }
          `}
          id="compare-current-btn"
          disabled
        >
          Compare with Current
        </button>
      </div>
      <div class="history-list">
        <table>
          <thead>
            <tr>
              <th></th>
              <th>Commit</th>
              <th>Message</th>
              <th>Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {commits.map((commit) => (
              <tr>
                <td>
                  <input
                    type="checkbox"
                    class="history-check"
                    value={commit.hash}
                    onchange={`
                      const checks = document.querySelectorAll('.history-check:checked');
                      document.getElementById('compare-btn').disabled = checks.length !== 2;
                      document.getElementById('compare-current-btn').disabled = checks.length !== 1;
                    `}
                  />
                </td>
                <td><code>{commit.shortHash}</code></td>
                <td>{commit.message}</td>
                <td>{new Date(commit.date).toLocaleDateString()}</td>
                <td>
                  <button
                    class="outline secondary"
                    style="font-size: 11px; padding: 0.2rem 0.4rem;"
                    hx-get={`/api/history/${filename}/${commit.hash}`}
                    hx-target="#version-preview"
                    hx-swap="innerHTML"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div id="diff-container"></div>
      <div id="version-preview"></div>
    </div>
  )
}

function JsonPreview({ content, commit }: { content: string; commit: string }) {
  let formatted: string
  try {
    formatted = JSON.stringify(JSON.parse(content), null, 2)
  } catch {
    formatted = content
  }
  return (
    <div class="json-preview-container">
      <h4>Version: {commit.slice(0, 7)}</h4>
      <pre class="json-code">{formatted}</pre>
    </div>
  )
}

function formatValue(val: unknown): string {
  if (val === null || val === undefined) return '–'
  if (typeof val === 'boolean') return val ? 'true' : 'false'
  if (typeof val === 'object') return JSON.stringify(val)
  return String(val)
}

function getColumns(changes: RecordChange[]): string[] {
  const colSet = new Set<string>()
  for (const c of changes) {
    const record = c.newRecord || c.oldRecord
    if (record) {
      for (const key of Object.keys(record)) {
        colSet.add(key)
      }
    }
  }
  const cols = Array.from(colSet)
  const idIdx = cols.indexOf('id')
  if (idIdx > 0) {
    cols.splice(idIdx, 1)
    cols.unshift('id')
  }
  return cols
}

function DiffView({ changes, from, to }: { changes: RecordChange[]; from: string; to: string }) {
  const added = changes.filter((c) => c.type === 'added')
  const removed = changes.filter((c) => c.type === 'removed')
  const modified = changes.filter((c) => c.type === 'modified')

  const modifiedCols = getColumns(modified)
  const addedCols = getColumns(added)
  const removedCols = getColumns(removed)

  return (
    <div class="diff-view">
      <div class="diff-header">
        <strong>Diff:</strong> {from.slice(0, 7)} → {to === 'current' ? 'Current' : to.slice(0, 7)}
        <span style="margin-left: 1rem; font-size: 12px;">
          <span class="diff-badge added">{added.length} added</span>
          <span class="diff-badge removed">{removed.length} removed</span>
          <span class="diff-badge modified">{modified.length} modified</span>
        </span>
      </div>

      {modified.length > 0 && (
        <div class="diff-section">
          <h5>Modified Records</h5>
          <div class="diff-table-wrapper">
            <table class="diff-table">
              <thead>
                <tr>
                  {modifiedCols.map((col) => (
                    <th>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {modified.map((change) => (
                  <>
                    <tr class="diff-row-old">
                      {modifiedCols.map((col) => (
                        <td class={change.changedFields?.has(col) ? 'diff-old' : ''}>
                          {formatValue(change.oldRecord?.[col])}
                        </td>
                      ))}
                    </tr>
                    <tr class="diff-row-new">
                      {modifiedCols.map((col) => (
                        <td class={change.changedFields?.has(col) ? 'diff-new' : ''}>
                          {formatValue(change.newRecord?.[col])}
                        </td>
                      ))}
                    </tr>
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {added.length > 0 && (
        <div class="diff-section">
          <h5>Added Records</h5>
          <div class="diff-table-wrapper">
            <table class="diff-table">
              <thead>
                <tr>
                  {addedCols.map((col) => (
                    <th>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {added.map((change) => (
                  <tr class="row-added">
                    {addedCols.map((col) => (
                      <td>{formatValue(change.newRecord?.[col])}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {removed.length > 0 && (
        <div class="diff-section">
          <h5>Removed Records</h5>
          <div class="diff-table-wrapper">
            <table class="diff-table">
              <thead>
                <tr>
                  {removedCols.map((col) => (
                    <th>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {removed.map((change) => (
                  <tr class="row-removed">
                    {removedCols.map((col) => (
                      <td>{formatValue(change.oldRecord?.[col])}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {changes.length === 0 && <p style="color: var(--pico-muted-color);">No changes detected.</p>}
    </div>
  )
}

function KvDiffView({ changes, from, to }: { changes: KvChange[]; from: string; to: string }) {
  const added = changes.filter((c) => c.type === 'added')
  const removed = changes.filter((c) => c.type === 'removed')
  const modified = changes.filter((c) => c.type === 'modified')

  return (
    <div class="diff-view">
      <div class="diff-header">
        <strong>Diff:</strong> {from.slice(0, 7)} → {to === 'current' ? 'Current' : to.slice(0, 7)}
        <span style="margin-left: 1rem; font-size: 12px;">
          <span class="diff-badge added">{added.length} added</span>
          <span class="diff-badge removed">{removed.length} removed</span>
          <span class="diff-badge modified">{modified.length} modified</span>
        </span>
      </div>

      <div class="kv-diff-list">
        {modified.map((c) => (
          <div class="kv-diff-item">
            <div class="kv-diff-key">{c.key}</div>
            <div class="kv-diff-values">
              <span class="diff-old">{formatValue(c.oldValue)}</span>
              <span class="kv-arrow">→</span>
              <span class="diff-new">{formatValue(c.newValue)}</span>
            </div>
          </div>
        ))}
        {added.map((c) => (
          <div class="kv-diff-item row-added">
            <div class="kv-diff-key">+ {c.key}</div>
            <div class="kv-diff-values">
              <span class="diff-new">{formatValue(c.newValue)}</span>
            </div>
          </div>
        ))}
        {removed.map((c) => (
          <div class="kv-diff-item row-removed">
            <div class="kv-diff-key">− {c.key}</div>
            <div class="kv-diff-values">
              <span class="diff-old">{formatValue(c.oldValue)}</span>
            </div>
          </div>
        ))}
      </div>

      {changes.length === 0 && <p style="color: var(--pico-muted-color);">No changes detected.</p>}
    </div>
  )
}

export const apiRoutes = new Elysia({ prefix: '/api' })
  .get(
    '/history/:filename',
    async ({ params }) => {
      const commits = await getFileHistory(params.filename)
      return <HistoryList commits={commits} filename={params.filename} />
    },
    { params: t.Object({ filename: t.String() }) }
  )
  .get(
    '/history/:filename/:hash',
    async ({ params }) => {
      const content = await getFileAtCommit(params.filename, params.hash)
      return <JsonPreview content={content} commit={params.hash} />
    },
    { params: t.Object({ filename: t.String(), hash: t.String() }) }
  )
  .get(
    '/diff/:filename',
    async ({ params, query }) => {
      const { from, to } = query as { from: string; to: string }
      const oldContent = await getFileAtCommit(params.filename, from)
      let newContent: string
      if (to === 'current') {
        const data = await loadData(params.filename as DataFileName)
        newContent = JSON.stringify(data)
      } else {
        newContent = await getFileAtCommit(params.filename, to)
      }

      const oldData = JSON.parse(oldContent)
      if (Array.isArray(oldData)) {
        const changes = computeRecordDiff(oldContent, newContent)
        return <DiffView changes={changes} from={from} to={to} />
      } else {
        const changes = computeKvDiff(oldContent, newContent)
        return <KvDiffView changes={changes} from={from} to={to} />
      }
    },
    { params: t.Object({ filename: t.String() }) }
  )
  .patch(
    '/:filename/:id',
    async ({ params, body }) => {
      const { filename, id } = params
      const { field, value } = body as { field: string; value: string }

      const updated = await updateRecord(filename as DataFileName, id, {
        [field]: value,
      })

      if (!updated) {
        return <td>Error: Record not found</td>
      }

      return (
        <TableCell
          row={updated}
          col={field}
          value={updated[field]}
          filename={filename as DataFileName}
        />
      )
    },
    {
      params: t.Object({ filename: t.String(), id: t.String() }),
    }
  )

export const apiKvRoutes = new Elysia({ prefix: '/api-kv' })
  .patch(
    '/:filename/:key',
    async ({ params, body }) => {
      const { filename, key } = params
      const { value } = body as { value: string }

      const data = await loadData(filename as DataFileName)
      if (Array.isArray(data)) {
        return <td>Error: Not a key-value file</td>
      }

      ;(data as Record<string, unknown>)[key] = value
      await saveData(filename as DataFileName, data)

      return (
        <KeyValueCell
          filename={filename as DataFileName}
          key={key}
          value={value}
        />
      )
    },
    {
      params: t.Object({ filename: t.String(), key: t.String() }),
    }
  )
