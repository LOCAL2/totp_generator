import { useState } from 'react'
import { encode } from './utils'

export default function AdminPage() {
  const [secret, setSecret] = useState('')
  const [digits, setDigits] = useState(6)
  const [period, setPeriod] = useState(30)
  const [shortUrl, setShortUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const clean = secret.trim().toUpperCase().replace(/\s/g, '')

  const handleGenerate = async () => {
    if (!clean) return
    setLoading(true)
    setError('')
    setShortUrl('')
    try {
      const hash = encode(clean, digits, period)
      const res = await fetch('/api/shorten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hash }),
      })
      if (!res.ok) throw new Error('Failed to shorten')
      const { id } = await res.json()
      setShortUrl(`${window.location.origin}/r/${id}`)
    } catch {
      setError('Failed to generate link. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (!shortUrl) return
    navigator.clipboard.writeText(shortUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="page">
      <div className="card">
        <div className="card-header">
          <p className="card-eyebrow">Configuration</p>
          <h1 className="card-title">Generate OTP Link</h1>
        </div>

        <div className="field">
          <label className="field-label" htmlFor="secret">Secret Key</label>
          <input
            id="secret"
            className="field-input"
            type="text"
            placeholder="Base32 encoded secret"
            value={secret}
            onChange={e => { setSecret(e.target.value); setShortUrl(''); setError('') }}
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        <div className="field-row">
          <div className="field">
            <label className="field-label" htmlFor="digits">Digits</label>
            <select id="digits" className="field-select" value={digits}
              onChange={e => { setDigits(Number(e.target.value)); setShortUrl('') }}>
              <option value={6}>6 digits</option>
              <option value={7}>7 digits</option>
              <option value={8}>8 digits</option>
            </select>
          </div>
          <div className="field">
            <label className="field-label" htmlFor="period">Period (s)</label>
            <input
              id="period"
              className="field-input"
              type="number"
              min={10}
              max={300}
              value={period}
              onChange={e => { setPeriod(Math.max(10, Number(e.target.value))); setShortUrl('') }}
            />
          </div>
        </div>

        <button
          className="gate-btn"
          style={{ marginTop: 24 }}
          onClick={handleGenerate}
          disabled={loading || !clean}
        >
          {loading ? 'Generating...' : 'Generate Link'}
        </button>

        {error && <p className="field-error" style={{ marginTop: 10, textAlign: 'center' }}>{error}</p>}

        {shortUrl && (
          <div className="share-section">
            <p className="share-label">Short Link</p>
            <div className="share-box">
              <span className="share-url">{shortUrl}</span>
              <button className="share-copy-btn" onClick={handleCopy}>
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p className="share-hint">Recipients can generate OTP codes but cannot modify the configuration.</p>
          </div>
        )}
      </div>
    </div>
  )
}
