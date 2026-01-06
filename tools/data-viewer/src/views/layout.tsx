import { Html } from '@elysiajs/html'

export function Layout({
  title,
  children,
}: {
  title: string
  children: JSX.Element
}) {
  return (
    <html lang="en" data-theme="dark">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css" />
        <script src="https://unpkg.com/htmx.org@2.0.4"></script>
        <style>{`
          :root { --pico-font-size: 14px; }
          body { margin: 0; }
          nav { margin-bottom: 0; }
          main.container { padding-top: 1rem; }
          .table-wrapper {
            max-height: calc(100vh - 220px);
            overflow: auto;
            border: 1px solid var(--pico-muted-border-color);
            border-radius: var(--pico-border-radius);
          }
          table { font-size: 13px; margin: 0; }
          thead { position: sticky; top: 0; z-index: 1; }
          th {
            cursor: pointer;
            user-select: none;
            white-space: nowrap;
            background: var(--pico-card-background-color);
          }
          th:hover { background: var(--pico-card-sectionning-background-color); }
          th .sort-indicator { margin-left: 0.25rem; color: var(--pico-primary); }
          td { max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          td.editable { cursor: pointer; }
          td.editable:hover { background: var(--pico-card-background-color); }
          .filter-bar { display: flex; gap: 1rem; align-items: center; margin-bottom: 1rem; }
          .filter-bar input { margin: 0; max-width: 300px; }
          .filter-bar small { color: var(--pico-muted-color); }
          .color-swatch {
            display: inline-block;
            width: 14px; height: 14px;
            border-radius: 3px;
            margin-right: 0.5rem;
            vertical-align: middle;
            border: 1px solid rgba(255,255,255,0.2);
          }
          .bool-badge { padding: 0.1rem 0.4rem; border-radius: 3px; font-size: 11px; }
          .bool-badge.true { background: #22c55e; color: #fff; }
          .bool-badge.false { background: #6b7280; color: #fff; }
          .cell-edit { font-size: 13px; padding: 0.25rem; margin: 0; }
          .resolved { color: var(--pico-muted-color); font-size: 11px; }
          .json-preview { color: var(--pico-primary); cursor: pointer; text-decoration: underline dotted; }
          .json-preview:hover { color: var(--pico-primary-hover); }
          .modal-backdrop {
            position: fixed; inset: 0;
            background: rgba(0,0,0,0.7);
            display: flex; align-items: center; justify-content: center;
            z-index: 1000;
          }
          .modal {
            background: var(--pico-card-background-color);
            border: 1px solid var(--pico-muted-border-color);
            border-radius: 8px;
            max-width: 90vw; max-height: 90vh;
            overflow: auto; padding: 1rem; min-width: 400px;
          }
          .modal-header {
            display: flex; justify-content: space-between; align-items: center;
            margin-bottom: 1rem; padding-bottom: 0.5rem;
            border-bottom: 1px solid var(--pico-muted-border-color);
          }
          .modal-header h3 { margin: 0; }
          .modal-close { background: none; border: none; color: var(--pico-muted-color); font-size: 1.5rem; cursor: pointer; }
          .modal-close:hover { color: var(--pico-color); }
          .nested-table { margin: 0.5rem 0; font-size: 12px; }
          .nested-table th, .nested-table td { padding: 0.3rem 0.5rem; }
          .array-index { color: var(--pico-muted-color); font-size: 11px; }
          .pagination { display: flex; align-items: center; gap: 1rem; margin-top: 1rem; }
          .pagination button { margin: 0; }
          .pagination span { color: var(--pico-muted-color); }
        `}</style>
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}

export function Topbar({
  files,
  active,
}: {
  files: readonly string[]
  active?: string
}) {
  return (
    <nav class="container-fluid">
      <ul>
        <li><strong>Data Viewer</strong></li>
      </ul>
      <ul>
        {files.map((file) => (
          <li>
            <a
              href={`/?file=${file}`}
              class={file === active ? 'contrast' : 'secondary'}
            >
              {file.replace('.json', '')}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
