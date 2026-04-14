import { createClient } from '@libsql/client/web'

export const config = { runtime: 'edge' }

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url)
  const id = url.searchParams.get('id')

  const headers = { 'Content-Type': 'application/json' }

  if (!id) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400, headers })

  const db = createClient({
    url: process.env.TURSO_URL!,
    authToken: process.env.TURSO_TOKEN!,
  })

  const result = await db.execute({
    sql: 'SELECT hash FROM short_urls WHERE id = ? LIMIT 1',
    args: [id],
  })

  if (result.rows.length === 0) {
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers })
  }

  return new Response(JSON.stringify({ hash: result.rows[0].hash }), { status: 200, headers })
}
