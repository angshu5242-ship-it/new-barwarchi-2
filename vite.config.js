import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { handleOrdersRequest } from './server/orders.js'
import { handleAuthRequest } from './server/auth.js'
import { handleSiteRequest } from './server/site.js'
import { handleMenuStylistRequest } from './server/menu-stylist.js'
import { handleStaffRequest } from './server/staff.js'

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > 200_000) {
        reject(new Error('Request body is too large.'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      if (!chunks.length) return resolve({})
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')))
      } catch {
        reject(new Error('Invalid JSON body.'))
      }
    })
    req.on('error', reject)
  })
}

function localApi() {
  const attach = (server) => {
    server.middlewares.use(async (req, res, next) => {
      const isOrders = req.url?.startsWith('/api/orders')
      const isAuth = req.url?.startsWith('/api/auth')
      const isSite = req.url?.startsWith('/api/site')
      const isStylist = req.url?.startsWith('/api/menu-stylist')
      const isStaff = req.url?.startsWith('/api/staff')
      if (!isOrders && !isAuth && !isSite && !isStylist && !isStaff) return next()
      try {
        const url = new URL(req.url, 'http://localhost')
        const query = Object.fromEntries(url.searchParams.entries())
        const body =
          req.method === 'POST' || req.method === 'PATCH' || req.method === 'DELETE'
            ? await readJsonBody(req)
            : null
        const handler = isAuth
          ? handleAuthRequest
          : isSite
            ? handleSiteRequest
            : isStylist
              ? handleMenuStylistRequest
              : isStaff
                ? handleStaffRequest
                : handleOrdersRequest
        const result = await handler({
          method: req.method,
          query,
          headers: req.headers,
          body,
        })
        res.statusCode = result.status
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.setHeader('Cache-Control', 'no-store')
        res.end(JSON.stringify(result.body))
      } catch (error) {
        res.statusCode = 400
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.end(JSON.stringify({ ok: false, error: error.message || 'Bad request.' }))
      }
    })
  }

  return {
    name: 'nb2-local-api',
    configureServer(server) {
      attach(server)
    },
    configurePreviewServer(server) {
      attach(server)
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  for (const [key, value] of Object.entries(env)) {
    if (process.env[key] === undefined) process.env[key] = value
  }

  return {
    plugins: [react(), localApi()],
    base: './',
    server: {
      host: true,
      port: 5199,
      strictPort: true,
      allowedHosts: [
        '.trycloudflare.com',
        'localhost',
        '127.0.0.1',
      ],
    },
    preview: {
      host: true,
      port: 5199,
      strictPort: true,
      allowedHosts: [
        '.trycloudflare.com',
        'localhost',
        '127.0.0.1',
      ],
    },
  }
})
