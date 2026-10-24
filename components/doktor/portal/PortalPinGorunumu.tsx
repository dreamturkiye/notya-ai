'use client'

/**
 * The patient portal's PIN page (Türkiye: "Sağlığım") as a plain presentational view. Türkiye's PinGate and every
 * country's patient page draw THROUGH this. No word is written here, and nothing is sent: the container owns the PIN,
 * the request and the errors. Needs `sagligim.css`.
 */
import type { Ref } from 'react'

export type PortalPinSozleri = {
  marka: string
  urun: string
  aciklama: string
  /** The hidden label of the PIN box. */
  etiket: string
  devam: string
  kontrol: string
  /** Said instead of the form when the link is too old to be safe. */
  eskiLink: string
}

export function PortalPinGorunumu({ s, pin, onPin, onGonder, mesgul, hata, eskiLink, hane = 6, girdiRef, oturumBitti }: {
  s: PortalPinSozleri
  pin: string
  /** The digits only, already cut to `hane`. */
  onPin: (digits: string) => void
  onGonder: () => void
  mesgul: boolean
  hata: string | null
  eskiLink: boolean
  hane?: number
  girdiRef?: Ref<HTMLInputElement>
  /** Said above the form: the session ended. */
  oturumBitti?: string | null
}) {
  return (
    <div className="sg-fade sg-pin-gate">
      <p className="sg-pin-brand">{s.marka}</p>
      <p className="sg-pin-product">{s.urun}</p>
      <p style={{ margin: '0 0 28px', color: 'var(--sg-muted)', lineHeight: 1.55, maxWidth: 340, fontSize: 15 }}>{s.aciklama}</p>
      {oturumBitti ? <p role="status" style={{ margin: '0 0 18px', color: 'var(--sg-muted)', maxWidth: 340, fontSize: 14 }}>{oturumBitti}</p> : null}

      {eskiLink ? (
        <p style={{ color: 'var(--sg-danger)', lineHeight: 1.5, maxWidth: 360 }}>{s.eskiLink}</p>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            onGonder()
          }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}
        >
          <label htmlFor="sagligim-pin" className="sr-only">
            {s.etiket}
          </label>
          <input
            ref={girdiRef}
            id="sagligim-pin"
            className="sg-pin-input"
            inputMode="numeric"
            autoComplete="one-time-code"
            enterKeyHint="done"
            pattern="[0-9]*"
            maxLength={hane}
            value={pin}
            disabled={mesgul}
            placeholder="······"
            aria-invalid={Boolean(hata)}
            onChange={(e) => onPin(e.target.value.replace(/\D/g, '').slice(0, hane))}
          />
          {hata && (
            <p role="alert" style={{ margin: 0, color: 'var(--sg-danger)', fontSize: 14 }}>
              {hata}
            </p>
          )}
          <button type="submit" className="sg-pin-btn" disabled={mesgul || pin.length !== hane}>
            {mesgul ? s.kontrol : s.devam}
          </button>
        </form>
      )}
    </div>
  )
}
