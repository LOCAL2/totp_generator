import { useState } from 'react'
import { buildViewerUrl } from './utils'

export default function AdminPage() {
  const [secret, setSecret] = useState('')
  const [digits, setDigits] = useState(6)
  const [period, setPeriod] = useState(30)
  const [copied, setCopied] = useState(false)

  const shareUrl = secret.trim()
    ? buildViewerUrl(secret.trim().toUpperCase().replace(/\s/g, ''), digits, period)
    : ''

  const handleCopy = () => {
    if (!shareUrl) return
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="totp-wrapper">
      <div className="totp-card">
        <h1>Create OTP Link</h1>

        <div className="field">
          <label htmlFor="secret">Secret Key</label>
          <input
            id="secret"
            type="text"
            placeholder="e.g. JBSWY3DPEHPK3PXP"
            value={secret}
            onChange={e => setSecret(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        <div className="row">
          <div className="field">
            <label htmlFor="digits">Number of Digits</label>
            <select id="digits" value={digits} onChange={e => setDigits(Number(e.target.value))}>
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
            />
          </div>
        </div>

        {shareUrl && (
          <div className="share-section">
            <label>Share Link</label>
            <div className="share-row">
              <span className="share-url">{shareUrl}</span>
              <button className="copy-btn" onClick={handleCopy}>
                {copied ? '✓ Copied' : 'Copy URL'}
              </button>
            </div>
            <p className="share-hint">User ที่ได้รับ link นี้จะ generate OTP ได้ แต่เปลี่ยนค่าไม่ได้</p>
          </div>
        )}
      </div>
    </div>
  )
}
