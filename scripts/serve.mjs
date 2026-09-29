// Minimal static server for the demo page (no dependencies): http://localhost:8080/demo/
import { createReadStream, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize } from 'node:path'

const root = new URL('..', import.meta.url).pathname
const port = Number(process.env.PORT ?? 8080)
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css' }

createServer((req, res) => {
  let path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '')
  if (path.endsWith('/')) path += 'index.html'
  const file = join(root, path)
  try {
    if (!statSync(file).isFile()) throw new Error()
    res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' })
    createReadStream(file).pipe(res)
  } catch {
    res.writeHead(404).end('not found')
  }
}).listen(port, () => console.log(`demo: http://localhost:${port}/demo/`))
