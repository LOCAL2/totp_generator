import { useState, useEffect, useRef } from 'react'

const STORAGE_KEY = 'totp_admin_auth'
const SESSION_TTL = 1000 * 60 * 60 * 8 // 8 hours

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

function isSessionValid(): boolean {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return false
    const { exp } = JSON.parse(raw)
    return Date.now() < exp
  } catch { return false }
}

function saveSession() {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ exp: Date.now() + SESSION_TTL }))
}

interface Props { children: React.ReactNode }

export default function AdminGate({ children }: Props) {
  const [authed, setAuthed] = useState(isSessionValid)
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!authed) setTimeout(() => inputRef.current?.focus(), 50)
  }, [authed])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    setLoading(true)
    setError(false)

    const hashed = await sha256(input)
    const expected = await sha256(import.meta.env.VITE_ADMIN_PASSWORD ?? '')

    if (hashed === expected) {
      saveSession()
      setAuthed(true)
    } else {
      setError(true)
      setInput('')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
    setLoading(false)
  }

  if (authed) return <>{children}</>

  return (
    <div className="page">
      <div className="card" style={{ maxWidth: 360 }}>
        <div className="card-header" style={{ textAlign: 'center', marginBottom: 28 }}>
          <div className="gate-icon">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h1 className="card-title" style={{ marginTop: 16 }}>Admin Access</h1>
          <p style={{ fontSize: 13, color: 'var(--text)', marginTop: 6 }}>Enter password to continue</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label className="field-label" htmlFor="gate-pw">Password</label>
            <input
              ref={inputRef}
              id="gate-pw"
              className={`field-input ${error ? 'field-input--error' : ''}`}
              type="password"
              value={input}
              onChange={e => { setInput(e.target.value); setError(false) }}
              placeholder="••••••••"
              autoComplete="current-password"
            />
            {error && <p className="field-error">Incorrect password</p>}
          </div>

          <button className="gate-btn" type="submit" disabled={loading || !input.trim()}>
            {loading ? 'Verifying...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  )
}
