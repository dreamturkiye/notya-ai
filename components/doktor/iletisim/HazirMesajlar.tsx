'use client'
/**
 * NOTYA-ILETISIM-01 — "Bugün N mesaj hazır" card (Ana Sayfa; Randevular for the secretary) and the calm
 * full-screen flow behind it: one patient at a time — name, short preview, one big send button (channel
 * already chosen, the other one as a quiet link), then "Gönderildi mi?". Evet moves to the next patient
 * by itself; Atla drops the message, Sonra puts it at the back of the line.
 *
 * Hidden when there is nothing to send (and before migration 095: the API answers 0).
 * A secretary only ever receives appointment items — the server filters, this component just shows.
 */
import React, { useCallback, useEffect, useState } from 'react'
import { CHROME_FONT, CHROME_RENK } from '@/lib/doktor/chromeTheme'
import { iletisimIstek } from '@/lib/iletisim/istemci'
import { TUR_ETIKETI, type MesajTuru } from '@/lib/iletisim/tipler'
import GonderDugmesi from './GonderDugmesi'

type Oge = { id: string; tur: MesajTuru; patientId: string; hastaAdi: string }

const R = CHROME_RENK

export default function HazirMesajlar({ kartStili }: { kartStili?: React.CSSProperties } = {}) {
  const [sayi, setSayi] = useState(0)
  const [acik, setAcik] = useState(false)
  const [ogeler, setOgeler] = useState<Oge[] | null>(null)
  const [hata, setHata] = useState('')
  const [bitenSayisi, setBitenSayisi] = useState(0)

  const sayiYukle = useCallback(async () => {
    try {
      const j = await iletisimIstek<{ sayi: number }>('/api/doktor/iletisim/kuyruk?sayi=1')
      setSayi(Number(j.sayi) || 0)
    } catch { setSayi(0) }
  }, [])
  useEffect(() => { void sayiYukle() }, [sayiYukle])

  const baslat = async () => {
    setAcik(true); setOgeler(null); setHata(''); setBitenSayisi(0)
    try {
      const j = await iletisimIstek<{ ogeler: Oge[] }>('/api/doktor/iletisim/kuyruk')
      setOgeler(j.ogeler || [])
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Mesajlar alınamadı.')
      setOgeler([])
    }
  }

  const kapat = () => { setAcik(false); void sayiYukle() }

  // Esc closes; the page behind does not scroll while the flow is open.
  useEffect(() => {
    if (!acik) return
    const onceki = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const tus = (e: KeyboardEvent) => { if (e.key === 'Escape') kapat() }
    window.addEventListener('keydown', tus)
    return () => { document.body.style.overflow = onceki; window.removeEventListener('keydown', tus) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acik])

  // The current patient is always the head of the line: sent / skipped items leave it, "Sonra" goes to the back.
  const simdiki = ogeler && ogeler.length ? ogeler[0] : null

  const cikar = (id: string) => setOgeler((o) => (o ? o.filter((x) => x.id !== id) : o))
  const gonderildi = (id: string) => {
    setBitenSayisi((n) => n + 1)
    // a short beat so "Gönderildi olarak kaydedildi" is seen, then the next patient
    window.setTimeout(() => cikar(id), 700)
  }
  const islem = async (o: Oge, tur: 'atla' | 'sonra') => {
    setHata('')
    try {
      await iletisimIstek('/api/doktor/iletisim/kuyruk', { method: 'PATCH', govde: { id: o.id, islem: tur } })
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Kaydedilemedi.')
      return
    }
    if (tur === 'atla') cikar(o.id)
    else setOgeler((l) => (l && l.length > 1 ? [...l.filter((x) => x.id !== o.id), o] : l))
  }

  if (!acik && sayi <= 0) return null

  return (
    <>
      {!acik && (
        <div style={{
          background: R.paper, border: `1px solid ${R.border}`, borderRadius: 20, padding: '18px 20px',
          boxShadow: '0 16px 34px rgba(58,44,34,0.06)', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
          fontFamily: CHROME_FONT.sans, ...kartStili,
        }}>
          <div style={{ flex: '1 1 220px', minWidth: 0 }}>
            <div style={{ fontFamily: CHROME_FONT.serif, fontSize: 22, fontWeight: 500, color: R.ink }}>Bugün {sayi} mesaj hazır</div>
            <div style={{ fontSize: 14, color: R.muted, marginTop: 4 }}>Tek tek açın, kendi WhatsApp’ınızdan ya da e-postanızdan gönderin.</div>
          </div>
          <button type="button" onClick={() => void baslat()} style={{ minHeight: 48, padding: '0 26px', borderRadius: 14, border: 'none', background: R.pine, color: R.paper, fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
            Başla
          </button>
        </div>
      )}

      {acik && (
        <div role="dialog" aria-modal="true" aria-label="Hazır mesajlar" style={{
          position: 'fixed', inset: 0, zIndex: 1000, background: R.cream, overflowY: 'auto',
          fontFamily: CHROME_FONT.sans, color: R.ink,
        }}>
          <div style={{ maxWidth: 600, margin: '0 auto', padding: '18px 18px 48px', boxSizing: 'border-box', minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 14, color: R.muted }}>
                {ogeler && ogeler.length > 0 ? `${bitenSayisi + 1}. mesaj · ${ogeler.length} kaldı` : 'Hazır mesajlar'}
              </div>
              <button type="button" onClick={kapat} aria-label="Kapat" style={{ minWidth: 44, minHeight: 44, border: 'none', background: 'none', fontSize: 26, color: R.muted, cursor: 'pointer' }}>×</button>
            </div>

            {!ogeler && <div style={{ color: R.muted, fontSize: 16, textAlign: 'center', marginTop: 60 }}>Hazırlanıyor…</div>}

            {ogeler && !simdiki && (
              <div style={{ textAlign: 'center', marginTop: 60 }}>
                <div style={{ fontFamily: CHROME_FONT.serif, fontSize: 28, fontWeight: 500, marginBottom: 8 }}>Hepsi tamam</div>
                <div style={{ fontSize: 15, color: R.muted, marginBottom: 28 }}>
                  {bitenSayisi > 0 ? `${bitenSayisi} mesaj gönderildi. ` : ''}Bugün hazır mesaj kalmadı.
                </div>
                <button type="button" onClick={kapat} style={{ minHeight: 50, padding: '0 32px', borderRadius: 14, border: 'none', background: R.pine, color: R.paper, fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>Kapat</button>
              </div>
            )}

            {simdiki && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontSize: 14, color: R.muted, marginBottom: 6 }}>{TUR_ETIKETI[simdiki.tur]}</div>
                <div style={{ fontFamily: CHROME_FONT.serif, fontSize: 30, fontWeight: 500, textAlign: 'center', marginBottom: 22, overflowWrap: 'anywhere' }}>{simdiki.hastaAdi}</div>
                <GonderDugmesi key={simdiki.id} tam tur={simdiki.tur} kuyrukId={simdiki.id} onGonderildi={() => gonderildi(simdiki.id)} />
                <div style={{ display: 'flex', gap: 28, marginTop: 22 }}>
                  <button type="button" onClick={() => void islem(simdiki, 'sonra')} style={{ background: 'none', border: 'none', color: R.muted, fontSize: 15, fontWeight: 600, cursor: 'pointer', minHeight: 44 }}>Sonra</button>
                  <button type="button" onClick={() => void islem(simdiki, 'atla')} style={{ background: 'none', border: 'none', color: R.muted, fontSize: 15, fontWeight: 600, cursor: 'pointer', minHeight: 44 }}>Atla</button>
                </div>
                {hata && <div style={{ color: R.warn, fontSize: 14, marginTop: 10 }}>{hata}</div>}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
