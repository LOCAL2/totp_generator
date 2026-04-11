import { useState, useEffect, useRef, useCallback } from 'react'
import { decode } from './utils'

declare const OTPAuth: {
  Secret: { fromBase32: (s: string) => unknown }
  TOTP: new (opts: { secret: unknown; digits: number; period: number }) => { generate: () => string }
}

export default function ViewerPage() {
  const config = decode(window.location.hash.slice(1))

  if (!config) {
    return (
      <div className="totp-wrapper">
        <div className="totp-card invalid-card">
          <span className="invalid-icon">🔗</span>
          <h1>Invalid Link</h1>
          <p>This link is invalid or has expired. Please request a new OTP link.</p>
        </div>
      </div>
    )
  }

  const { secret, digits, period } = config
  const [token, setToken] = useState('')
  const [timeLeft, setTimeLeft] = useState(0)
  const [copied, setCopied] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const generate = useCallback(() => {
    try {
      const otp = new OTPAuth.TOTP({
        secret: OTPAuth.Secret.fromBase32(secret),
        digits,
        period,
      })
      setToken(otp.generate())
    } catch {
      setToken('ERROR')
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

  const handleCopy = () => {
    if (!token) return
    navigator.clipboard.writeText(token).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  const progress = timeLeft / period

  return (
    <div className="totp-wrapper">
      <div className="totp-card">
        <h1>TOTP Token</h1>

        <div className="token-section">
          <div className="token-display" onClick={handleCopy} title="Click to copy">
            <span className="token-value">{token}</span>
            <span className="copy-hint">{copied ? '✓ Copied' : 'Copy'}</span>
          </div>
          <div className="timer-bar-wrap">
            <div className="timer-bar" style={{ width: `${progress * 100}%`, '--progress': progress } as React.CSSProperties} />
          </div>
          <p className="timer-label">Refreshes in {timeLeft}s</p>
        </div>

        <div className="meta-row">
          <span>{digits} digits</span>
          <span>·</span>
          <span>every {period}s</span>
        </div>
      </div>
    </div>
  )
}
