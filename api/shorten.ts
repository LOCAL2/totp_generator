import { createClient } from '@libsql/client/web'

export const config = { runtime: 'edge' }

function nanoid(len = 7): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  const bytes = crypto.getRandomValues(new Uint8Array(len))
  return Array.from(bytes).map(b => chars[b % chars.length]).join('')
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })

  const origin = req.headers.get('origin') ?? ''
  const headers = {
    'Access-Control-Allow-Origin': origin,
    'Content-Type': 'application/json',
  }

  let hash: string
  try {
    const body = await req.json()
    hash = body.hash
    if (!hash || typeof hash !== 'string') throw new Error()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid body' }), { status: 400, headers })
  }

  const db = createClient({
    url: process.env.TURSO_URL!,
    authToken: process.env.TURSO_TOKEN!,
  })

  // init table if not exists
  await db.execute(`
    CREATE TABLE IF NOT EXISTS short_urls (
      id TEXT PRIMARY KEY,
      hash TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `)

  // check if same hash already exists → reuse
  const existing = await db.execute({
    sql: 'SELECT id FROM short_urls WHERE hash = ? LIMIT 1',
    args: [hash],
  })

  if (existing.rows.length > 0) {
    return new Response(JSON.stringify({ id: existing.rows[0].id }), { status: 200, headers })
  }

  // create new short id
  let id = nanoid()
  // ensure uniqueness
  for (let i = 0; i < 5; i++) {
    const check = await db.execute({ sql: 'SELECT id FROM short_urls WHERE id = ?', args: [id] })
    if (check.rows.length === 0) break
    id = nanoid()
  }

  await db.execute({
    sql: 'INSERT INTO short_urls (id, hash, created_at) VALUES (?, ?, ?)',
    args: [id, hash, Date.now()],
  })

  return new Response(JSON.stringify({ id }), { status: 200, headers })
}
