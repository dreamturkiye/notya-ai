'use client'

/**
 * NOTYA-RANDEVU-V2 — Sağlığım › Randevu. Three taps: type → day → time (the time tap sends the request).
 * Below: the patient's own upcoming appointments with what they may do under the doctor's policy.
 * Shown only while the doctor's 'Hasta Portalı Randevu' is ON (the API answers { acik: false } otherwise).
 */
import { useCallback, useEffect, useState } from 'react'
import { usePortalLive } from '../../../_components/PortalLiveProvider'
import { SectionHeader, SoftPanel } from '../../../_components/ui'

type Tur = { tur: string; ad: string; sure: number }
type Slot = { bas: string; saat: string }
type Gun = { gun: string; slotlar: Slot[] }
type Randevu = {
  id: string
  gun: string
  saat: string
  etiket: string
  durum: string
  oneri: boolean
  izinler: { iptal: boolean; ertele: boolean; teyit: boolean; neden: string | null }
}

const gunAdi = (gun: string) =>
  new Intl.DateTimeFormat('tr-TR', { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(`${gun}T12:00:00Z`))

function SaatSecici({ gunler, onSec, mesgul }: { gunler: Gun[]; onSec: (bas: string) => void; mesgul: boolean }) {
  const [gun, setGun] = useState<string>('')
  const secili = gunler.find((g) => g.gun === gun)
  if (!gunler.length) return <p style={{ color: 'var(--sg-muted)', margin: '8px 0' }}>Önümüzdeki günlerde boş saat yok. Lütfen muayenehaneyi arayın.</p>
  return (
    <>
      <div className="sg-filter-row" role="group" aria-label="Gün">
        {gunler.map((g) => (
          <button key={g.gun} type="button" className={`sg-chip-btn${g.gun === gun ? ' is-active' : ''}`} onClick={() => setGun(g.gun)}>
            {gunAdi(g.gun)}
          </button>
        ))}
      </div>
      {secili && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }} role="group" aria-label="Saat">
          {secili.slotlar.map((s) => (
            <button key={s.bas} type="button" className="sg-chip-btn" disabled={mesgul} onClick={() => onSec(s.bas)}>
              {s.saat}
            </button>
          ))}
        </div>
      )}
    </>
  )
}

export default function HastaRandevuPage() {
  const { token } = usePortalLive()
  const api = `/api/portal/hasta/${encodeURIComponent(token)}/randevu`
  const [yuk, setYuk] = useState(true)
  const [acik, setAcik] = useState(false)
  const [turler, setTurler] = useState<Tur[]>([])
  const [randevular, setRandevular] = useState<Randevu[]>([])
  const [tur, setTur] = useState('')
  const [gunler, setGunler] = useState<Gun[] | null>(null)
  const [ertele, setErtele] = useState<string>('')
  const [erteleGunler, setErteleGunler] = useState<Gun[] | null>(null)
  const [mesaj, setMesaj] = useState('')
  const [hata, setHata] = useState('')
  const [mesgul, setMesgul] = useState(false)

  const yukle = useCallback(async () => {
    const r = await fetch(api, { credentials: 'include' })
    const j = await r.json().catch(() => ({}))
    setYuk(false)
    if (!r.ok || !j.acik) { setAcik(false); return }
    setAcik(true)
    setTurler(j.turler || [])
    setRandevular(j.randevular || [])
    if ((j.turler || []).length === 1) setTur(j.turler[0].tur)
  }, [api])

  useEffect(() => { void yukle() }, [yukle])

  useEffect(() => {
    if (!tur) { setGunler(null); return }
    setGunler(null)
    fetch(`${api}?tur=${encodeURIComponent(tur)}`, { credentials: 'include' })
      .then((r) => r.json()).then((j) => setGunler(j.gunler || [])).catch(() => setGunler([]))
  }, [api, tur])

  useEffect(() => {
    if (!ertele) { setErteleGunler(null); return }
    fetch(`${api}?randevuId=${encodeURIComponent(ertele)}`, { credentials: 'include' })
      .then((r) => r.json()).then((j) => setErteleGunler(j.gunler || [])).catch(() => setErteleGunler([]))
  }, [api, ertele])

  const gonder = async (govde: Record<string, unknown>, basari: (j: { onayBekliyor?: boolean }) => string) => {
    setMesgul(true); setHata(''); setMesaj('')
    try {
      const r = await fetch(api, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(govde) })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setHata(j.error || 'İşlem yapılamadı.'); return }
      setMesaj(basari(j)); setTur(turler.length === 1 ? turler[0].tur : ''); setErtele('')
      await yukle()
    } finally {
      setMesgul(false)
    }
  }

  if (yuk) return <div className="sg-fade" style={{ padding: '48px 8px', color: 'var(--sg-muted)', textAlign: 'center' }}>Yükleniyor…</div>
  if (!acik) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Randevu" subtitle="Online randevu şu an kapalı. Randevu için muayenehaneyi arayabilirsiniz." />
      </div>
    )
  }

  return (
    <div className="sg-fade">
      <SectionHeader title="Randevu" subtitle="Tür, gün ve saat seçin. Talebiniz muayenehaneye iletilir; sonucu burada ve e-postanızda görürsünüz." />

      {mesaj && <SoftPanel style={{ marginBottom: 12, borderColor: 'var(--sg-ok)' }}>{mesaj}</SoftPanel>}
      {hata && <SoftPanel style={{ marginBottom: 12, color: 'var(--sg-danger)' }}>{hata}</SoftPanel>}

      <SoftPanel style={{ marginBottom: 16 }}>
        {turler.length > 1 && (
          <div className="sg-filter-row" role="group" aria-label="Randevu türü">
            {turler.map((t) => (
              <button key={t.tur} type="button" className={`sg-chip-btn${t.tur === tur ? ' is-active' : ''}`} onClick={() => setTur(t.tur)}>
                {t.ad}
              </button>
            ))}
          </div>
        )}
        {!tur && <p style={{ color: 'var(--sg-muted)', margin: 0 }}>Önce randevu türünü seçin.</p>}
        {tur && gunler === null && <p style={{ color: 'var(--sg-muted)', margin: 0 }}>Boş saatler yükleniyor…</p>}
        {tur && gunler && (
          <SaatSecici
            gunler={gunler}
            mesgul={mesgul}
            onSec={(bas) => void gonder({ islem: 'talep', tur, baslangic: bas }, (j) =>
              j.onayBekliyor ? 'Talebiniz alındı. Muayenehane onayladığında size haber vereceğiz.' : 'Randevunuz oluşturuldu ve onaylandı.')}
          />
        )}
      </SoftPanel>

      <h2 className="sg-display" style={{ fontSize: 20, margin: '8px 0 10px' }}>Randevularım</h2>
      {!randevular.length && <p style={{ color: 'var(--sg-muted)' }}>Yaklaşan randevunuz yok.</p>}
      {randevular.map((r) => (
        <SoftPanel key={r.id} style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline', flexWrap: 'wrap' }}>
            <b>{r.gun} · {r.saat}</b>
            <span style={{ color: r.oneri ? 'var(--sg-sun-ink)' : r.durum === 'iptal' ? 'var(--sg-muted)' : 'var(--sg-accent-ink)', fontSize: 13, fontWeight: 600 }}>{r.etiket}</span>
          </div>
          {(r.oneri || r.izinler.teyit || r.izinler.ertele || r.izinler.iptal) && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
              {r.oneri && <button type="button" className="sg-chip-btn is-active" disabled={mesgul} onClick={() => void gonder({ islem: 'kabul', randevuId: r.id }, () => 'Yeni saati kabul ettiniz; randevunuz onaylandı.')}>Bu saati kabul et</button>}
              {r.izinler.teyit && <button type="button" className="sg-chip-btn is-active" disabled={mesgul} onClick={() => void gonder({ islem: 'teyit', randevuId: r.id }, () => 'Teşekkürler, geleceğinizi muayenehaneye ilettik.')}>Geliyorum</button>}
              {r.izinler.ertele && <button type="button" className="sg-chip-btn" disabled={mesgul} onClick={() => setErtele(ertele === r.id ? '' : r.id)}>Başka saat seç</button>}
              {r.izinler.iptal && <button type="button" className="sg-chip-btn" disabled={mesgul} onClick={() => { if (window.confirm('Randevunuz iptal edilsin mi?')) void gonder({ islem: 'iptal', randevuId: r.id }, () => 'Randevunuz iptal edildi.') }}>İptal et</button>}
            </div>
          )}
          {r.izinler.neden && r.durum !== 'iptal' && <p style={{ color: 'var(--sg-muted)', fontSize: 13, margin: '8px 0 0' }}>{r.izinler.neden}</p>}
          {ertele === r.id && (
            <div style={{ marginTop: 12 }}>
              {erteleGunler === null
                ? <p style={{ color: 'var(--sg-muted)', margin: 0 }}>Boş saatler yükleniyor…</p>
                : <SaatSecici gunler={erteleGunler} mesgul={mesgul} onSec={(bas) => void gonder({ islem: 'ertele', randevuId: r.id, baslangic: bas }, (j) =>
                    j.onayBekliyor ? 'Yeni saat talebiniz alındı. Muayenehane onayladığında size haber vereceğiz.' : 'Randevunuz yeni saate taşındı.')} />}
            </div>
          )}
        </SoftPanel>
      ))}
    </div>
  )
}
