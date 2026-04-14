import { createClient } from '@libsql/client/web'

export const config = { runtime: 'edge' }

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url)
  const id = url.pathname.split('/').pop()

  if (!id) return new Response('Not Found', { status: 404 })

  const db = createClient({
    url: process.env.TURSO_URL!,
    authToken: process.env.TURSO_TOKEN!,
  })

  const result = await db.execute({
    sql: 'SELECT hash FROM short_urls WHERE id = ? LIMIT 1',
    args: [id],
  })

  if (result.rows.length === 0) {
    return new Response('Not Found', { status: 404 })
  }

  const hash = result.rows[0].hash as string
  const baseUrl = url.origin

  // redirect to viewer with hash
  return Response.redirect(`${baseUrl}/#${hash}`, 302)
}
