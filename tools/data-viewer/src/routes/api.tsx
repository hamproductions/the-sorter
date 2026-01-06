import { Elysia, t } from 'elysia'
import { Html } from '@elysiajs/html'
import { TableCell, KeyValueCell } from '../views/table'
import {
  loadData,
  saveData,
  updateRecord,
  type DataFileName,
} from '../services/data'

type DataRecord = Record<string, unknown> & { id?: string }

export const apiRoutes = new Elysia({ prefix: '/api' })
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
