import { useState } from 'react'
import { buildViewerUrl } from './utils'

export default function AdminPage() {
  const [secret, setSecret] = useState('')
  const [digits, setDigits] = useState(6)
  const [period, setPeriod] = useState(30)
  const [copied, setCopied] = useState(false)

  const clean = secret.trim().toUpperCase().replace(/\s/g, '')
  const shareUrl = clean ? buildViewerUrl(clean, digits, period) : ''

  const handleCopy = () => {
    if (!shareUrl) return
    navigator.clipboard.writeText(shareUrl).then(() => {
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
            onChange={e => setSecret(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        <div className="field-row">
          <div className="field">
            <label className="field-label" htmlFor="digits">Digits</label>
            <select id="digits" className="field-select" value={digits} onChange={e => setDigits(Number(e.target.value))}>
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
              onChange={e => setPeriod(Math.max(10, Number(e.target.value)))}
            />
          </div>
        </div>

        {shareUrl && (
          <div className="share-section">
            <p className="share-label">Shareable Link</p>
            <div className="share-box">
              <span className="share-url">{shareUrl}</span>
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
