import { Html } from '@elysiajs/html'
import { resolveField, type DataFileName } from '../services/data'

type DataRecord = Record<string, unknown> & { id?: string }

function getColumns(data: DataRecord[]): string[] {
  if (data.length === 0) return []
  const allKeys = new Set<string>()
  for (const row of data.slice(0, 100)) {
    Object.keys(row).forEach((k) => allKeys.add(k))
  }
  const priority = ['id', 'name', 'englishName', 'fullName']
  const sorted = [...allKeys].sort((a, b) => {
    const ai = priority.indexOf(a)
    const bi = priority.indexOf(b)
    if (ai !== -1 && bi !== -1) return ai - bi
    if (ai !== -1) return -1
    if (bi !== -1) return 1
    return a.localeCompare(b)
  })
  return sorted
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function isJsonValue(value: unknown): boolean {
  return value !== null && typeof value === 'object'
}

function JsonValue({ value, depth = 0 }: { value: unknown; depth?: number }): JSX.Element {
  if (value === null) return <span class="null">null</span>
  if (value === undefined) return <span class="null">—</span>
  if (typeof value === 'boolean') {
    return (
      <span class={`bool-badge ${value ? 'true' : 'false'}`}>
        {value ? '✓' : '✗'}
      </span>
    )
  }
  if (typeof value === 'number' || typeof value === 'string') {
    return <span>{String(value)}</span>
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return <span class="null">[]</span>
    if (typeof value[0] === 'object' && value[0] !== null) {
      const keys = [...new Set(value.flatMap((item) => (item ? Object.keys(item) : [])))]
      return (
        <table class="nested-table">
          <thead>
            <tr>
              <th>#</th>
              {keys.map((k) => <th>{k}</th>)}
            </tr>
          </thead>
          <tbody>
            {value.map((item, i) => (
              <tr>
                <td class="array-index">{i}</td>
                {keys.map((k) => (
                  <td>
                    <JsonValue value={item?.[k]} depth={depth + 1} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )
    }
    return <span>{value.map((v) => formatValue(v)).join(', ')}</span>
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value)
    if (entries.length === 0) return <span class="null">{'{}'}</span>
    return (
      <table class="nested-table">
        <tbody>
          {entries.map(([k, v]) => (
            <tr>
              <td><strong>{k}</strong></td>
              <td>
                <JsonValue value={v} depth={depth + 1} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }
  return <span>{String(value)}</span>
}

function JsonModal({ fieldName, value, rowId }: { fieldName: string; value: unknown; rowId: string }): JSX.Element {
  const modalId = `modal-${rowId}-${fieldName}`
  return (
    <>
      <span
        class="json-preview"
        onclick={`document.getElementById('${modalId}').style.display='flex'`}
      >
        {Array.isArray(value) ? `[${value.length} items]` : '{...}'}
      </span>
      <div id={modalId} class="modal-backdrop" style="display:none" onclick={`if(event.target===this)this.style.display='none'`}>
        <div class="modal">
          <div class="modal-header">
            <h3>{fieldName}</h3>
            <button class="modal-close" onclick={`document.getElementById('${modalId}').style.display='none'`}>×</button>
          </div>
          <JsonValue value={value} />
        </div>
      </div>
    </>
  )
}

function isColorField(col: string): boolean {
  return col.toLowerCase().includes('color')
}

function isBooleanValue(value: unknown): boolean {
  return typeof value === 'boolean'
}

function isEditable(col: string): boolean {
  const editableFields = ['name', 'englishName', 'fullName', 'description', 'venue', 'school']
  return editableFields.includes(col)
}

const PAGE_SIZE = 50

export function DataTable({
  data,
  filename,
  filter,
  sort,
  sortDir,
  page = 1,
}: {
  data: DataRecord[]
  filename: DataFileName
  filter?: string
  sort?: string
  sortDir?: 'asc' | 'desc'
  page?: number
}) {
  let filtered = data
  if (filter) {
    const q = filter.toLowerCase()
    filtered = data.filter((row) =>
      Object.values(row).some((v) => formatValue(v).toLowerCase().includes(q))
    )
  }

  if (sort) {
    filtered = [...filtered].sort((a, b) => {
      const aVal = formatValue(a[sort])
      const bVal = formatValue(b[sort])
      const cmp = aVal.localeCompare(bVal, undefined, { numeric: true })
      return sortDir === 'desc' ? -cmp : cmp
    })
  }

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const currentPage = Math.min(Math.max(1, page), totalPages || 1)
  const start = (currentPage - 1) * PAGE_SIZE
  const displayData = filtered.slice(start, start + PAGE_SIZE)
  const columns = getColumns(filtered)

  const buildUrl = (p: number) => {
    const params = new URLSearchParams()
    params.set('page', String(p))
    if (filter) params.set('filter', filter)
    if (sort) params.set('sort', sort)
    if (sortDir) params.set('dir', sortDir)
    return `/table/${filename}?${params}`
  }

  return (
    <div id="table-container">
      <div class="filter-bar">
        <input
          type="search"
          name="filter"
          placeholder="Filter..."
          value={filter || ''}
          hx-get={`/table/${filename}?page=1${sort ? `&sort=${sort}&dir=${sortDir}` : ''}`}
          hx-trigger="input changed delay:300ms"
          hx-target="#table-container"
          hx-include="this"
        />
        <small>
          {filtered.length} records
        </small>
      </div>

      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              {columns.map((col) => {
                const isActive = sort === col
                const params = new URLSearchParams()
                params.set('page', '1')
                if (filter) params.set('filter', filter)

                let indicator = ''
                if (isActive && sortDir === 'asc') {
                  params.set('sort', col)
                  params.set('dir', 'desc')
                  indicator = '▲'
                } else if (isActive && sortDir === 'desc') {
                  indicator = '▼'
                } else {
                  params.set('sort', col)
                  params.set('dir', 'asc')
                }

                return (
                  <th
                    hx-get={`/table/${filename}?${params}`}
                    hx-target="#table-container"
                  >
                    {col}
                    {indicator && <span class="sort-indicator">{indicator}</span>}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {displayData.map((row) => (
              <TableRow row={row} columns={columns} filename={filename} />
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div class="pagination">
          <button
            disabled={currentPage === 1}
            hx-get={buildUrl(currentPage - 1)}
            hx-target="#table-container"
          >
            ← Prev
          </button>
          <span>Page {currentPage} of {totalPages}</span>
          <button
            disabled={currentPage === totalPages}
            hx-get={buildUrl(currentPage + 1)}
            hx-target="#table-container"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}

export function TableRow({
  row,
  columns,
  filename,
}: {
  row: DataRecord
  columns: string[]
  filename: DataFileName
}) {
  return (
    <tr id={`row-${row.id}`}>
      {columns.map((col) => (
        <TableCell row={row} col={col} value={row[col]} filename={filename} />
      ))}
    </tr>
  )
}

export function TableCell({
  row,
  col,
  value,
  filename,
  editing,
}: {
  row: DataRecord
  col: string
  value: unknown
  filename: DataFileName
  editing?: boolean
}) {
  const resolved = resolveField(col, value)
  const displayValue = resolved?.display || formatValue(value)
  const editable = isEditable(col) && row.id
  const isColor = isColorField(col)
  const isBool = isBooleanValue(value)

  if (editing && editable) {
    const cancelUrl = `/cell/${filename}/${row.id}/${col}`
    return (
      <td id={`cell-${row.id}-${col}`}>
        <input
          class="cell-edit"
          type="text"
          name="value"
          value={formatValue(value)}
          autofocus
          hx-patch={`/api/${filename}/${row.id}`}
          hx-trigger="blur[!event.target.dataset.cancelled], keydown[key=='Enter']"
          hx-target={`#cell-${row.id}-${col}`}
          hx-swap="outerHTML"
          hx-vals={JSON.stringify({ field: col })}
          onkeydown={`if(event.key==='Escape'){this.dataset.cancelled='true';htmx.ajax('GET','${cancelUrl}',{target:'#cell-${row.id}-${col}',swap:'outerHTML'})}`}
        />
      </td>
    )
  }

  if (isBool) {
    return (
      <td>
        <span class={`bool-badge ${value ? 'true' : 'false'}`}>
          {value ? '✓' : '✗'}
        </span>
      </td>
    )
  }

  if (isColor && typeof value === 'string' && value) {
    return (
      <td>
        <span class="color-swatch" style={`background:${value}`}></span>
        {value}
      </td>
    )
  }

  if (editable) {
    return (
      <td
        id={`cell-${row.id}-${col}`}
        class="editable"
        hx-get={`/cell/${filename}/${row.id}/${col}?edit=true`}
        hx-trigger="click"
        hx-swap="outerHTML"
        title="Click to edit (Esc to cancel)"
      >
        {displayValue}
      </td>
    )
  }

  if (isJsonValue(value) && row.id) {
    return (
      <td>
        <JsonModal fieldName={col} value={value} rowId={row.id} />
        {resolved && <span class="resolved"> → {resolved.display}</span>}
      </td>
    )
  }

  return (
    <td>
      {displayValue}
    </td>
  )
}

export function KeyValueTable({
  data,
  filename,
}: {
  data: Record<string, unknown>
  filename: DataFileName
}) {
  const entries = Object.entries(data)

  return (
    <div id="table-container">
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Key</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(([key, value]) => (
              <tr>
                <td>{key}</td>
                {isJsonValue(value) ? (
                  <td>
                    <JsonModal fieldName={key} value={value} rowId={`kv-${key}`} />
                  </td>
                ) : (
                  <td
                    id={`cell-kv-${key}`}
                    class="editable"
                    hx-get={`/cell-kv/${filename}/${key}?edit=true`}
                    hx-trigger="click"
                    hx-swap="outerHTML"
                    title="Click to edit"
                  >
                    {formatValue(value)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function KeyValueCell({
  filename,
  key,
  value,
  editing,
}: {
  filename: DataFileName
  key: string
  value: unknown
  editing?: boolean
}) {
  if (editing) {
    return (
      <td id={`cell-kv-${key}`}>
        <input
          class="cell-edit"
          type="text"
          name="value"
          value={formatValue(value)}
          autofocus
          hx-patch={`/api-kv/${filename}/${key}`}
          hx-trigger="blur, keydown[key=='Enter']"
          hx-target={`#cell-kv-${key}`}
          hx-swap="outerHTML"
        />
      </td>
    )
  }

  return (
    <td
      id={`cell-kv-${key}`}
      class="editable"
      hx-get={`/cell-kv/${filename}/${key}?edit=true`}
      hx-trigger="click"
      hx-swap="outerHTML"
      title="Click to edit"
    >
      {formatValue(value)}
    </td>
  )
}
