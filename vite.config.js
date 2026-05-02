import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

function dataFilePlugin() {
  return {
    name: 'data-file-sync',
    configureServer(server) {
      server.middlewares.use('/data/records.json', (req, res) => {
        const filePath = path.resolve(process.cwd(), 'public/data/records.json')

        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

        if (req.method === 'OPTIONS') { res.end(); return }

        if (req.method === 'GET') {
          try {
            const data = fs.readFileSync(filePath, 'utf-8')
            res.setHeader('Content-Type', 'application/json')
            res.end(data)
          } catch {
            res.setHeader('Content-Type', 'application/json')
            res.end('{"records":[],"studyProgress":{},"dailyTodos":{"lastDate":"","todos":[]}}')
          }
          return
        }

        if (req.method === 'PUT') {
          let body = ''
          req.on('data', chunk => { body += chunk })
          req.on('end', () => {
            try {
              JSON.parse(body) // validate
              fs.writeFileSync(filePath, body, 'utf-8')
              res.setHeader('Content-Type', 'application/json')
              res.end('{"ok":true}')
            } catch {
              res.statusCode = 400
              res.end('{"error":"Invalid JSON"}')
            }
          })
          return
        }

        res.statusCode = 405
        res.end('{"error":"Method Not Allowed"}')
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), dataFilePlugin()],
  server: {
    host: '0.0.0.0'
  }
})