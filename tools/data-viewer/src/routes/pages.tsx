import { Elysia, t } from 'elysia'
import { Html } from '@elysiajs/html'
import { Layout, Topbar } from '../views/layout'
import { DataTable, TableCell, KeyValueTable, KeyValueCell } from '../views/table'
import { getDataFiles, loadData, buildLookups, type DataFileName } from '../services/data'

type DataRecord = Record<string, unknown> & { id?: string }

export const pageRoutes = new Elysia()
  .get('/', async ({ query }) => {
    await buildLookups()
    const files = getDataFiles()
    const activeFile = (query.file as DataFileName) || files[0]
    const data = await loadData(activeFile)
    const isArray = Array.isArray(data)

    return (
      <Layout title={`Data Viewer - ${activeFile}`}>
        <>
          <Topbar files={files} active={activeFile} />
          <main class="container">
            <h2>{activeFile}</h2>
            {isArray ? (
              <DataTable
                data={data as DataRecord[]}
                filename={activeFile}
                filter={query.filter as string | undefined}
                sort={query.sort as string | undefined}
                sortDir={(query.dir as 'asc' | 'desc') || 'asc'}
                page={Number(query.page) || 1}
              />
            ) : (
              <KeyValueTable
                data={data as Record<string, unknown>}
                filename={activeFile}
              />
            )}
          </main>
        </>
      </Layout>
    )
  })
  .get(
    '/table/:filename',
    async ({ params, query }) => {
      await buildLookups()
      const filename = params.filename as DataFileName
      const data = await loadData(filename)
      const isArray = Array.isArray(data)

      if (isArray) {
        return (
          <DataTable
            data={data as DataRecord[]}
            filename={filename}
            filter={query.filter as string | undefined}
            sort={query.sort as string | undefined}
            sortDir={(query.dir as 'asc' | 'desc') || 'asc'}
            page={Number(query.page) || 1}
          />
        )
      }

      return (
        <KeyValueTable data={data as Record<string, unknown>} filename={filename} />
      )
    },
    { params: t.Object({ filename: t.String() }) }
  )
  .get(
    '/cell/:filename/:id/:col',
    async ({ params, query }) => {
      const { filename, id, col } = params
      const data = await loadData(filename as DataFileName)
      if (!Array.isArray(data)) return ''

      const row = data.find((r) => r.id === id)
      if (!row) return ''

      return (
        <TableCell
          row={row as DataRecord}
          col={col}
          value={(row as DataRecord)[col]}
          filename={filename as DataFileName}
          editing={query.edit === 'true'}
        />
      )
    },
    { params: t.Object({ filename: t.String(), id: t.String(), col: t.String() }) }
  )
  .get(
    '/cell-kv/:filename/:key',
    async ({ params, query }) => {
      const { filename, key } = params
      const data = await loadData(filename as DataFileName)
      if (Array.isArray(data)) return ''

      const value = (data as Record<string, unknown>)[key]

      return (
        <KeyValueCell
          filename={filename as DataFileName}
          key={key}
          value={value}
          editing={query.edit === 'true'}
        />
      )
    },
    { params: t.Object({ filename: t.String(), key: t.String() }) }
  )
