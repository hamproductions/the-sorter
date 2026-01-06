import { Elysia } from 'elysia'
import { html } from '@elysiajs/html'
import { pageRoutes } from './routes/pages'
import { apiRoutes, apiKvRoutes } from './routes/api'
import { buildLookups } from './services/data'

const app = new Elysia()
  .use(html())
  .use(pageRoutes)
  .use(apiRoutes)
  .use(apiKvRoutes)
  .onStart(async () => {
    await buildLookups()
    console.log('Lookup tables built')
  })
  .listen(3001)

console.log(`Data Viewer running at http://localhost:${app.server?.port}`)
