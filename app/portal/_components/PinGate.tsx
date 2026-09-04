'use client'

import { useEffect, useRef, useState } from 'react'

type Props = {
  token: string
  onUnlocked: () => void
}

export function PinGate({ token, onUnlocked }: Props) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [legacy, setLegacy] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const submit = async (value?: string) => {
    const digits = (value ?? pin).replace(/\D/g, '').slice(0, 6)
    if (digits.length !== 6) {
      setError('6 haneli PIN girin.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/portal/hasta/${encodeURIComponent(token)}/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ pin: digits }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        if ((json as { code?: string }).code === 'legacy_no_pin') setLegacy(true)
        setError(String((json as { error?: string }).error || 'PIN doğrulanamadı'))
        setPin('')
        inputRef.current?.focus()
        return
      }
      onUnlocked()
    } catch {
      setError('Bağlantı hatası. Tekrar deneyin.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="sg-fade sg-pin-gate">
      <p className="sg-pin-brand">Notya</p>
      <p className="sg-pin-product">Sağlığım</p>
      <p style={{ margin: '0 0 28px', color: 'var(--sg-muted)', lineHeight: 1.55, maxWidth: 340, fontSize: 15 }}>
        Alanınızı açmak için doktorunuzun verdiği 6 haneli PIN&apos;i girin.
      </p>

      {legacy ? (
        <p style={{ color: 'var(--sg-danger)', lineHeight: 1.5, maxWidth: 360 }}>
          Bu bağlantı artık güvenli değil. Doktorunuzdan yeni bir link ve PIN isteyin.
        </p>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void submit()
          }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}
        >
          <label htmlFor="sagligim-pin" className="sr-only">
            6 haneli PIN
          </label>
          <input
            ref={inputRef}
            id="sagligim-pin"
            className="sg-pin-input"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={6}
            value={pin}
            disabled={busy}
            placeholder="······"
            aria-invalid={Boolean(error)}
            onChange={(e) => {
              const next = e.target.value.replace(/\D/g, '').slice(0, 6)
              setPin(next)
              setError(null)
              if (next.length === 6) void submit(next)
            }}
          />
          {error && (
            <p role="alert" style={{ margin: 0, color: 'var(--sg-danger)', fontSize: 14 }}>
              {error}
            </p>
          )}
          <button type="submit" className="sg-pin-btn" disabled={busy || pin.length !== 6}>
            {busy ? 'Kontrol ediliyor…' : 'Devam'}
          </button>
        </form>
      )}
    </div>
  )
}
