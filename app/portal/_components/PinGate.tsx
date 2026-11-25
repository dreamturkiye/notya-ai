'use client'

import { useEffect, useRef, useState } from 'react'
import { turkceHataMesaji } from '@/lib/turkce/dogrulamaMesaji'
import { PortalPinGorunumu, type PortalPinSozleri } from '@/components/doktor/portal/PortalPinGorunumu'
import { MarkaKarsilama, NotyaAltyapi } from '@/components/doktor/portal/HekimMarkasi'
import { BILINMEYEN_MARKA, BOLUM_ADI, type PortalMarka } from '@/lib/portal/marka'

export const PIN_SOZLERI: PortalPinSozleri = {
  // HASTA-ALANI-MARKA: the word mark is not drawn in Türkiye — the doctor's block (MarkaKarsilama) takes its place.
  marka: BOLUM_ADI,
  urun: BOLUM_ADI,
  aciklama: 'Alanınızı açmak için doktorunuzun verdiği 6 haneli PIN\'i girin.',
  etiket: '6 haneli PIN',
  devam: 'Devam',
  kontrol: 'Kontrol ediliyor…',
  eskiLink: 'Bu bağlantı artık güvenli değil. Doktorunuzdan yeni bir link ve PIN isteyin.',
}

type Props = {
  token: string
  onUnlocked: () => void
  /** HASTA-ALANI-MARKA — the doctor's brand, rendered by the server layout (no request before the PIN). */
  marka?: PortalMarka | null
}

export function PinGate({ token, onUnlocked, marka = null }: Props) {
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
        setError(turkceHataMesaji((json as { error?: string }).error) || 'PIN doğrulanamadı. Lütfen tekrar deneyin.')
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
    <PortalPinGorunumu
      s={PIN_SOZLERI}
      pin={pin}
      onPin={(next) => {
        setPin(next)
        setError(null)
        if (next.length === 6) void submit(next)
      }}
      onGonder={() => void submit()}
      mesgul={busy}
      hata={error}
      eskiLink={legacy}
      girdiRef={inputRef}
      ust={<MarkaKarsilama marka={marka || BILINMEYEN_MARKA} />}
      alt={<NotyaAltyapi />}
    />
  )
}
