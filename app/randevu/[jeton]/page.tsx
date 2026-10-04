'use client'

/**
 * NOTYA-RANDEVU-V2 — one appointment, one action, from an e-mail link. Opening the page changes nothing
 * (mail scanners open links); the patient confirms with one tap. Ertele shows free times of the same length.
 */
import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { SoftPanel } from '../../portal/_components/ui'

type Slot = { bas: string; saat: string }
type Gun = { gun: string; slotlar: Slot[] }
type Bilgi = {
  eylem: 'geliyorum' | 'ertele' | 'iptal' | 'kabul'
  gun: string
  saat: string
  doktorAdi: string
  etiket: string
  yapilabilir: boolean
  neden: string | null
  gunler: Gun[] | null
}

const DUGME: Record<Bilgi['eylem'], string> = {
  geliyorum: 'Geliyorum',
  kabul: 'Bu saati kabul ediyorum',
  iptal: 'Randevuyu iptal et',
  ertele: '',
}

const gunAdi = (gun: string) =>
  new Intl.DateTimeFormat('tr-TR', { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(`${gun}T12:00:00Z`))

export default function RandevuEylemSayfasi() {
  const params = useParams()
  const jeton = String(params?.jeton || '')
  const [bilgi, setBilgi] = useState<Bilgi | null>(null)
  const [hata, setHata] = useState('')
  const [sonuc, setSonuc] = useState('')
  const [mesgul, setMesgul] = useState(false)
  const [gun, setGun] = useState('')

  useEffect(() => {
    fetch(`/api/randevu/eylem?t=${encodeURIComponent(jeton)}`)
      .then(async (r) => { const j = await r.json().catch(() => ({})); if (!r.ok) setHata(j.error || 'Bağlantı açılamadı.'); else setBilgi(j) })
      .catch(() => setHata('Bağlantı açılamadı.'))
  }, [jeton])

  const yap = useCallback(async (baslangic?: string) => {
    setMesgul(true); setHata('')
    try {
      const r = await fetch('/api/randevu/eylem', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ t: jeton, baslangic }) })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setHata(j.error || 'İşlem yapılamadı.'); return }
      const ne = bilgi?.eylem
      setSonuc(
        ne === 'geliyorum' ? 'Teşekkürler, geleceğinizi muayenehaneye ilettik.'
          : ne === 'kabul' ? `Randevunuz onaylandı: ${j.gun} · ${j.saat}.`
            : ne === 'iptal' ? 'Randevunuz iptal edildi.'
              : j.onayBekliyor ? `Yeni saat talebiniz alındı (${j.gun} · ${j.saat}). Muayenehane onayladığında size haber vereceğiz.`
                : `Randevunuz ${j.gun} · ${j.saat} saatine taşındı.`,
      )
    } finally {
      setMesgul(false)
    }
  }, [bilgi?.eylem, jeton])

  if (!bilgi) {
    return <div className="sg-fade" style={{ padding: '48px 8px', textAlign: 'center', color: hata ? 'var(--sg-danger)' : 'var(--sg-muted)' }}>{hata || 'Yükleniyor…'}</div>
  }
  const secili = bilgi.gunler?.find((g) => g.gun === gun)
  return (
    <div className="sg-fade" style={{ maxWidth: 560, margin: '0 auto' }}>
      <h1 className="sg-display" style={{ fontSize: 26, margin: '8px 0 4px' }}>{bilgi.gun} · {bilgi.saat}</h1>
      <p style={{ color: 'var(--sg-muted)', margin: '0 0 16px' }}>{[bilgi.doktorAdi, bilgi.etiket].filter(Boolean).join(' · ')}</p>
      {sonuc ? (
        <SoftPanel>{sonuc}</SoftPanel>
      ) : !bilgi.yapilabilir ? (
        <SoftPanel>{bilgi.neden}</SoftPanel>
      ) : bilgi.eylem === 'ertele' ? (
        <SoftPanel>
          <p style={{ margin: '0 0 10px' }}>Size uyan yeni günü ve saati seçin.</p>
          {!bilgi.gunler?.length && <p style={{ color: 'var(--sg-muted)', margin: 0 }}>Önümüzdeki günlerde boş saat yok. Lütfen muayenehaneyi arayın.</p>}
          <div className="sg-filter-row">
            {(bilgi.gunler || []).map((g) => (
              <button key={g.gun} type="button" className={`sg-chip-btn${g.gun === gun ? ' is-active' : ''}`} onClick={() => setGun(g.gun)}>{gunAdi(g.gun)}</button>
            ))}
          </div>
          {secili && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {secili.slotlar.map((s) => (
                <button key={s.bas} type="button" className="sg-chip-btn" disabled={mesgul} onClick={() => void yap(s.bas)}>{s.saat}</button>
              ))}
            </div>
          )}
        </SoftPanel>
      ) : (
        <button type="button" className="sg-pin-btn" disabled={mesgul} onClick={() => void yap()}>{DUGME[bilgi.eylem]}</button>
      )}
      {hata && <p style={{ color: 'var(--sg-danger)', marginTop: 12 }}>{hata}</p>}
    </div>
  )
}
