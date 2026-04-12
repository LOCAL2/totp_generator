import { useState, useEffect, useRef, useCallback } from 'react'
import { decode } from './utils'

declare const OTPAuth: {
  Secret: { fromBase32: (s: string) => unknown }
  TOTP: new (opts: { secret: unknown; digits: number; period: number }) => { generate: () => string }
}

function InvalidPage() {
  return (
    <div className="page">
      <div className="card" style={{ textAlign: 'center', maxWidth: 360 }}>
        <div className="invalid-icon-wrap">
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <h2 className="invalid-title">Invalid Link</h2>
        <p className="invalid-desc">This link is invalid or has expired.<br />Please request a new OTP link.</p>
      </div>
    </div>
  )
}

export default function ViewerPage() {
  const config = decode(window.location.hash.slice(1))
  if (!config) return <InvalidPage />

  const { secret, digits, period } = config
  const [token, setToken] = useState('')
  const [timeLeft, setTimeLeft] = useState(0)
  const [animKey, setAnimKey] = useState(0)
  const [copied, setCopied] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const animElapsed = useRef(0)
  const lastCounter = useRef(-1)

  const generate = useCallback(() => {
    const counter = Math.floor(Date.now() / 1000 / period)
    if (counter === lastCounter.current) return
    lastCounter.current = counter
    try {
      const otp = new OTPAuth.TOTP({ secret: OTPAuth.Secret.fromBase32(secret), digits, period })
      setToken(otp.generate())
      animElapsed.current = (Date.now() / 1000) % period
      setAnimKey(k => k + 1)
    } catch { setToken('ERROR') }
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

  const handleCopy = () => {
    if (!token || token === 'ERROR') return
    navigator.clipboard.writeText(token).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  const barStyle = {
    '--period': `${period}s`,
    animationDelay: `-${animElapsed.current}s`,
  } as React.CSSProperties

  return (
    <div className="page">
      <div className="card">
        <div className="card-header" style={{ textAlign: 'center' }}>
          <p className="card-eyebrow">One-Time Password</p>
          <h1 className="card-title">Authentication Code</h1>
        </div>

        <div className="token-section">
          <div className="token-card" onClick={handleCopy} role="button" tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && handleCopy()}>
            <p className={`token-hint ${copied ? 'token-hint--copied' : ''}`}>
              {copied ? 'Copied to clipboard' : 'Click to copy'}
            </p>
            <p className="token-digits">{token}</p>
          </div>

          <div className="progress-wrap">
            <div
              key={animKey}
              className="progress-bar progress-bar--shrink"
              style={barStyle}
            />
          </div>
          <p className="progress-label">Refreshes in {timeLeft}s</p>
        </div>
      </div>
    </div>
  )
}
