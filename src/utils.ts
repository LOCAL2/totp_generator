export function encode(secret: string, digits: number, period: number): string {
  return btoa(`${secret}|${digits}|${period}`)
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function decode(hash: string): { secret: string; digits: number; period: number } | null {
  try {
    const b64 = hash.replace(/-/g, '+').replace(/_/g, '/')
    const raw = atob(b64)
    const [secret, d, p] = raw.split('|')
    if (!secret) return null
    return { secret, digits: Number(d ?? 6), period: Number(p ?? 30) }
  } catch {
    return null
  }
}

export function buildViewerUrl(secret: string, digits: number, period: number): string {
  const hash = encode(secret, digits, period)
  return `${window.location.origin}/#${hash}`
}
