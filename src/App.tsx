import { useState, useEffect, useRef, useCallback } from 'react'
import './App.css'

declare const OTPAuth: {
  Secret: { fromBase32: (s: string) => unknown }
  TOTP: new (opts: { secret: unknown; digits: number; period: number }) => { generate: () => string }
}

function encode(secret: string, digits: number, period: number): string {
  return btoa(`${secret}|${digits}|${period}`)
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function decode(hash: string): { secret: string; digits: number; period: number } | null {
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

function parseHash(): { secret: string; digits: number; period: number } | null {
  const hash = window.location.hash.slice(1)
  if (!hash) return null
  return decode(hash)
}

function buildShareUrl(secret: string, digits: number, period: number): string {
  return `${window.location.origin}${window.location.pathname}#${encode(secret, digits, period)}`
}

function App() {
  const locked = parseHash()
  const isLocked = locked !== null

  const [secret, setSecret] = useState(locked?.secret ?? '')
  const [digits, setDigits] = useState(locked?.digits ?? 6)
  const [period, setPeriod] = useState(locked?.period ?? 30)
  const [token, setToken] = useState('')
  const [timeLeft, setTimeLeft] = useState(0)
  const [error, setError] = useState('')
  const [copiedToken, setCopiedToken] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const generate = useCallback(() => {
    if (!secret.trim()) { setToken(''); setError(''); return }
    try {
      const otp = new OTPAuth.TOTP({
        secret: OTPAuth.Secret.fromBase32(secret.trim().toUpperCase().replace(/\s/g, '')),
        digits,
        period,
      })
      setToken(otp.generate())
      setError('')
    } catch {
      setToken('')
      setError('Invalid secret key — must be a valid Base32 string')
    }
  }, [secret, digits, period])

  useEffect(() => {
    generate()
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      const remaining = period - (Math.floor(Date.now() / 1000) % period)
      setTimeLeft(remaining)
      if (remaining === period) generate()
    }, 500)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [generate, period])

  useEffect(() => {
    setTimeLeft(period - (Math.floor(Date.now() / 1000) % period))
  }, [period])

  const handleCopyToken = () => {
    if (!token) return
    navigator.clipboard.writeText(token).then(() => {
      setCopiedToken(true)
      setTimeout(() => setCopiedToken(false), 1500)
    })
  }

  const handleCopyUrl = () => {
    if (!secret.trim()) return
    const url = buildShareUrl(secret.trim().toUpperCase().replace(/\s/g, ''), digits, period)
    navigator.clipboard.writeText(url).then(() => {
      setCopiedUrl(true)
      setTimeout(() => setCopiedUrl(false), 2000)
    })
  }

  const shareUrl = secret.trim()
    ? buildShareUrl(secret.trim().toUpperCase().replace(/\s/g, ''), digits, period)
    : ''

  const progress = timeLeft / period

  return (
    <div className="totp-wrapper">
      <div className="totp-card">
        <h1>TOTP Token Generator</h1>

        <div className="field">
          <label htmlFor="secret">Secret Key</label>
          <input
            id="secret"
            type="text"
            placeholder="e.g. JBSWY3DPEHPK3PXP"
            value={secret}
            onChange={e => setSecret(e.target.value)}
            readOnly={isLocked}
            autoComplete="off"
            spellCheck={false}
            className={isLocked ? 'locked' : ''}
          />
          {error && <span className="error">{error}</span>}
        </div>

        <div className="row">
          <div className="field">
            <label htmlFor="digits">Number of Digits</label>
            <select id="digits" value={digits} onChange={e => setDigits(Number(e.target.value))} disabled={isLocked}>
              <option value={6}>6</option>
              <option value={7}>7</option>
              <option value={8}>8</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="period">Token Period (seconds)</label>
            <input
              id="period"
              type="number"
              min={10}
              max={300}
              value={period}
              onChange={e => setPeriod(Math.max(10, Number(e.target.value)))}
              readOnly={isLocked}
              className={isLocked ? 'locked' : ''}
            />
          </div>
        </div>

        {token && (
          <div className="token-section">
            <div className="token-display" onClick={handleCopyToken} title="Click to copy token">
              <span className="token-value">{token}</span>
              <span className="copy-hint">{copiedToken ? '✓ Copied' : 'Copy'}</span>
            </div>
            <div className="timer-bar-wrap">
              <div className="timer-bar" style={{ width: `${progress * 100}%`, '--progress': progress } as React.CSSProperties} />
            </div>
            <p className="timer-label">Refreshes in {timeLeft}s</p>
          </div>
        )}

        {!isLocked && shareUrl && (
          <div className="share-section">
            <label>Share Link</label>
            <div className="share-row">
              <span className="share-url">{shareUrl}</span>
              <button className="copy-btn" onClick={handleCopyUrl}>
                {copiedUrl ? '✓ Copied' : 'Copy URL'}
              </button>
            </div>
            <p className="share-hint">Anyone with this link can generate the OTP — but cannot change the settings.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
