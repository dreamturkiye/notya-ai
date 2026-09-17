'use client'
/** NOTYA-DAH-WOW W2.7 — Sağlığım › Muayene öncesi anket (hasta yüzü). Veri PIN sonrası API'den gelir; HTML'de PHI yok. Yorum/tanı gösterilmez. */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePortalLive } from '../../../_components/PortalLiveProvider'
import { SectionHeader, SoftPanel } from '../../../_components/ui'
import type { AnketSablon } from '@/specialties/dahiliye/engines/anket'

type Kb = { sbp: string; dbp: string }
const girdi: React.CSSProperties = { border: '1px solid var(--sg-line, #E6EAF0)', borderRadius: 10, padding: '8px 10px', fontSize: 15, width: 90 }

export default function OnAnketPage() {
  const { token, basePath } = usePortalLive()
  const [sablon, setSablon] = useState<AnketSablon | null>(null)
  const [uygun, setUygun] = useState<boolean | null>(null)
  const [kb, setKb] = useState<Kb[]>([{ sbp: '', dbp: '' }])
  const [glukoz, setGlukoz] = useState('')
  const [kilo, setKilo] = useState('')
  const [doz, setDoz] = useState('')
  const [yanEtki, setYanEtki] = useState('')
  const [semptom, setSemptom] = useState<string[]>([])
  const [sorular, setSorular] = useState('')
  const [durum, setDurum] = useState<{ ok?: boolean; mesaj?: string; acil?: string | null } | null>(null)

  useEffect(() => {
    fetch(`/api/portal/hasta/${encodeURIComponent(token)}/dahiliye-anket`, { credentials: 'include' }).then((r) => r.json()).then((j) => { setUygun(!!j.uygun); setSablon(j.sablon || null) }).catch(() => setUygun(false))
  }, [token])

  const gonder = async () => {
    setDurum(null)
    const body = { kb: kb.filter((k) => k.sbp && k.dbp).map((k) => ({ sbp: Number(k.sbp), dbp: Number(k.dbp) })), glukoz: glukoz ? glukoz.split(/[ ,;]+/).filter(Boolean).map((x) => ({ deger: Number(x) })) : [], kilo: kilo || null, kacirilanDoz: doz || null, yanEtki: yanEtki || null, semptomlar: semptom, sorular: sorular || null }
    const r = await fetch(`/api/portal/hasta/${encodeURIComponent(token)}/dahiliye-anket`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) return setDurum({ ok: false, mesaj: j.error || 'Gönderilemedi' })
    setDurum({ ok: true, mesaj: `Teşekkürler, yanıtlarınız doktorunuza iletildi.${j.uyarilar?.length ? ` Not: ${j.uyarilar.join(' ')}` : ''}`, acil: j.acilMetni })
  }

  if (uygun === null) return <SoftPanel>Yükleniyor…</SoftPanel>
  if (!uygun || !sablon) return (<div><SectionHeader title="Muayene öncesi anket" subtitle="Bu anket, iç hastalıkları takibiniz başladığında açılır." /><Link href={`${basePath}/takip`} className="sg-back-link">← Takip</Link></div>)
  return (
    <div className="sg-fade">
      <SectionHeader title="Muayene öncesi anket" subtitle="Randevunuzdan önce 2 dakikada doldurun; doktorunuz muayenede görür. Bu form acil başvuru yerine geçmez." />
      {durum?.acil && <SoftPanel><b style={{ color: 'var(--sg-coral-ink, #B23A48)' }}>{durum.acil}</b></SoftPanel>}
      {durum?.mesaj && <SoftPanel><span style={{ color: durum.ok ? 'var(--sg-accent-ink)' : 'var(--sg-coral-ink, #B23A48)' }}>{durum.mesaj}</span></SoftPanel>}
      {!durum?.ok && (<SoftPanel>
        <div style={{ display: 'grid', gap: 14, fontSize: 15 }}>
          <div><b>Evde ölçtüğünüz tansiyon</b> <span style={{ color: 'var(--sg-muted)', fontSize: 13 }}>(büyük / küçük)</span>
            {kb.map((k, i) => <div key={i} style={{ display: 'flex', gap: 8, marginTop: 6 }}><input inputMode="numeric" style={girdi} placeholder="büyük" value={k.sbp} onChange={(e) => setKb(kb.map((x, j) => (j === i ? { ...x, sbp: e.target.value } : x)))} /><input inputMode="numeric" style={girdi} placeholder="küçük" value={k.dbp} onChange={(e) => setKb(kb.map((x, j) => (j === i ? { ...x, dbp: e.target.value } : x)))} /></div>)}
            {kb.length < 14 && <button type="button" className="sg-chip" style={{ marginTop: 6 }} onClick={() => setKb([...kb, { sbp: '', dbp: '' }])}>+ ölçüm ekle</button>}
          </div>
          {sablon.olcumler.includes('glukoz') && <div><b>Evde ölçtüğünüz kan şekeri</b> <span style={{ color: 'var(--sg-muted)', fontSize: 13 }}>(mg/dL, virgülle ayırın)</span><div><input style={{ ...girdi, width: 240, marginTop: 6 }} value={glukoz} onChange={(e) => setGlukoz(e.target.value)} placeholder="ör. 110, 135" /></div></div>}
          <div><b>Kilonuz</b> <span style={{ color: 'var(--sg-muted)', fontSize: 13 }}>(kg)</span><div><input inputMode="decimal" style={{ ...girdi, marginTop: 6 }} value={kilo} onChange={(e) => setKilo(e.target.value)} /></div></div>
          <div><b>Son 7 günde ilaç dozu kaçırdınız mı?</b><div style={{ display: 'flex', gap: 8, marginTop: 6 }}>{[['0', 'Hayır'], ['1-2', '1–2 kez'], ['3+', '3 kez veya daha fazla']].map(([v, a]) => <button key={v} type="button" className="sg-chip" style={{ fontWeight: doz === v ? 700 : 400, outline: doz === v ? '2px solid var(--sg-accent)' : 'none' }} onClick={() => setDoz(v)}>{a}</button>)}</div></div>
          <div><b>İlaçlarla ilgili yan etki / şikâyet</b><textarea style={{ ...girdi, width: '100%', marginTop: 6 }} rows={2} maxLength={500} value={yanEtki} onChange={(e) => setYanEtki(e.target.value)} /></div>
          <div><b>Son 2 haftada yaşadıklarınız</b><div style={{ display: 'grid', gap: 6, marginTop: 6 }}>{sablon.semptomlar.map((x) => <label key={x.kod} style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="checkbox" checked={semptom.includes(x.kod)} onChange={(e) => setSemptom(e.target.checked ? [...semptom, x.kod] : semptom.filter((y) => y !== x.kod))} />{x.ad}</label>)}</div></div>
          <div><b>Doktorunuza sormak istedikleriniz</b><textarea style={{ ...girdi, width: '100%', marginTop: 6 }} rows={3} maxLength={1000} value={sorular} onChange={(e) => setSorular(e.target.value)} /></div>
          <button type="button" className="sg-pin-btn" style={{ justifySelf: 'start' }} onClick={gonder}>Gönder</button>
        </div>
      </SoftPanel>)}
      <Link href={`${basePath}/takip`} className="sg-back-link" style={{ margin: '0 16px' }}>← Takip</Link>
    </div>
  )
}
