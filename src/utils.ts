export function encode(secret: string, digits: number, period: number): string {
  const raw = `${secret}|${digits}|${period}`
  const bytes = new TextEncoder().encode(raw)
  let binary = ''
  bytes.forEach(b => binary += String.fromCharCode(b))
  return btoa(binary)
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function decode(hash: string): { secret: string; digits: number; period: number } | null {
  try {
    const b64 = hash.replace(/-/g, '+').replace(/_/g, '/')
    const binary = atob(b64)
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0))
    const raw = new TextDecoder().decode(bytes)
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
