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
  const [animKey, setAnimKey] = useState(0)
  const [phase, setPhase] = useState<'fill' | 'shrink'>('shrink')
  const [copied, setCopied] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const animStartElapsed = useRef(0)

  const generate = useCallback(() => {
    try {
      const otp = new OTPAuth.TOTP({
        secret: OTPAuth.Secret.fromBase32(secret),
        digits,
        period,
      })
      setToken(otp.generate())
      animStartElapsed.current = (Date.now() / 1000) % period
      // ถ้า elapsed น้อยมาก (token เพิ่ง reset) ให้ทำ fill ก่อน
      if (animStartElapsed.current < 1) {
        setPhase('fill')
        setAnimKey(k => k + 1)
        setTimeout(() => {
          animStartElapsed.current = (Date.now() / 1000) % period
          setPhase('shrink')
          setAnimKey(k => k + 1)
        }, 400)
      } else {
        setPhase('shrink')
        setAnimKey(k => k + 1)
      }
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

  const barStyle = {
    '--period': `${period}s`,
    animationDelay: `-${animStartElapsed.current}s`,
  } as React.CSSProperties

  return (
    <div className="totp-wrapper">
      <div className="totp-card">
        <h1>TOTP Token</h1>

        <div className="token-section">
          <div className="token-display" onClick={handleCopy} title="Click to copy">
              <span className="token-label">{copied ? '✓ Copied to clipboard' : 'Tap to copy'}</span>
              <span className="token-value">{token}</span>
            </div>
          <div className="timer-bar-wrap">
            <div key={animKey} className={`timer-bar ${phase === 'fill' ? 'timer-bar--fill' : 'timer-bar--anim'}`} style={barStyle} />
          </div>
          <p className="timer-label">Refreshes in {timeLeft}s</p>
        </div>


      </div>
    </div>
  )
}
