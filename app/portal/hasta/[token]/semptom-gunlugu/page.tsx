'use client'
/**
 * KD-TARAMA-01 — Sağlığım › Semptom günlüğü (hasta yüzü). Yalnız Kadın Hastalıkları ve Doğum hekiminin açtığı günlük
 * için; veri PIN sonrası API'den gelir, HTML'de PHI yok. Hastaya yorum/tanı gösterilmez — sonucu doktor değerlendirir.
 */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePortalLive } from '../../../_components/PortalLiveProvider'
import { SectionHeader, SoftPanel } from '../../../_components/ui'
import { PMDD_ALAN_HASTA, PMDD_ISLEV_HASTA, PMDD_OLCEK_ETIKET } from '@/specialties/kadin-dogum/engines/kdTaramaMetinleri'

type Durum = { uygun: boolean; alanlar?: string[]; islevAlanlari?: string[]; bugun?: string; sonGunler?: Array<{ tarih: string; adet: boolean }> }

export default function SemptomGunluguPage() {
  const { token, basePath } = usePortalLive()
  const [d, setD] = useState<Durum | null>(null)
  const [gun, setGun] = useState<'bugun' | 'dun'>('bugun')
  const [adet, setAdet] = useState(false)
  const [puan, setPuan] = useState<Record<string, number>>({})
  const [islev, setIslev] = useState<Record<string, number>>({})
  const [mesaj, setMesaj] = useState<{ ok: boolean; metin: string } | null>(null)
  const yukle = () => fetch(`/api/portal/hasta/${encodeURIComponent(token)}/kd-gunluk`, { credentials: 'include' }).then((r) => r.json()).then(setD).catch(() => setD({ uygun: false }))
  useEffect(() => { yukle() }, [token]) // eslint-disable-line react-hooks/exhaustive-deps

  const tarih = (): string => {
    if (!d?.bugun) return ''
    if (gun === 'bugun') return d.bugun
    return new Date(Date.parse(`${d.bugun}T00:00:00Z`) - 86400000).toISOString().slice(0, 10)
  }
  const gonder = async () => {
    setMesaj(null)
    const r = await fetch(`/api/portal/hasta/${encodeURIComponent(token)}/kd-gunluk`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tarih: tarih(), adet, puan, islev }) })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) return setMesaj({ ok: false, metin: j.error || 'Kaydedilemedi' })
    setMesaj({ ok: true, metin: 'Kaydedildi. Doktorunuz günlüğünüzü muayenede görür.' }); setPuan({}); setIslev({}); setAdet(false); yukle()
  }
  const satir = (anahtar: string, metin: string, deger: number | undefined, yaz: (v: number) => void) => (
    <div key={anahtar} style={{ display: 'grid', gap: 6 }}>
      <span>{metin}</span>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {PMDD_OLCEK_ETIKET.map((e, i) => (
          <button key={i} type="button" className="sg-chip" aria-pressed={deger === i} style={{ fontWeight: deger === i ? 700 : 400, outline: deger === i ? '2px solid var(--sg-accent)' : 'none' }} onClick={() => yaz(i)}>{e}</button>
        ))}
      </div>
    </div>
  )

  if (d === null) return <SoftPanel>Yükleniyor…</SoftPanel>
  if (!d.uygun) return (<div><SectionHeader title="Semptom günlüğü" subtitle="Bu günlük, kadın hastalıkları ve doğum hekiminiz başlattığında açılır." /><Link href={`${basePath}/takip`} className="sg-back-link">← Takip</Link></div>)
  return (
    <div className="sg-fade">
      <SectionHeader title="Semptom günlüğü" subtitle="Her gün, o günü düşünerek doldurun. En az iki adet döngüsü boyunca düzenli doldurmanız doktorunuzun değerlendirmesi için önemlidir. Acil bir durumda 112'yi arayın." />
      {mesaj && <SoftPanel><span style={{ color: mesaj.ok ? 'var(--sg-accent-ink)' : 'var(--sg-coral-ink, #B23A48)' }}>{mesaj.metin}</span></SoftPanel>}
      <SoftPanel>
        <div style={{ display: 'grid', gap: 16, fontSize: 15 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="sg-chip" aria-pressed={gun === 'bugun'} style={{ fontWeight: gun === 'bugun' ? 700 : 400 }} onClick={() => setGun('bugun')}>Bugün</button>
            <button type="button" className="sg-chip" aria-pressed={gun === 'dun'} style={{ fontWeight: gun === 'dun' ? 700 : 400 }} onClick={() => setGun('dun')}>Dün</button>
          </div>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="checkbox" checked={adet} onChange={(e) => setAdet(e.target.checked)} /> Bu gün adet kanamam vardı</label>
          {(d.alanlar || []).map((a) => satir(a, PMDD_ALAN_HASTA[a] || a, puan[a], (v) => setPuan({ ...puan, [a]: v })))}
          <b>Günlük yaşamınız</b>
          {(d.islevAlanlari || []).map((a) => satir(a, PMDD_ISLEV_HASTA[a] || a, islev[a], (v) => setIslev({ ...islev, [a]: v })))}
          <button type="button" className="sg-pin-btn" style={{ justifySelf: 'start' }} onClick={gonder}>Kaydet</button>
        </div>
      </SoftPanel>
      {!!d.sonGunler?.length && <SoftPanel><b>Son 14 gün</b><div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>{d.sonGunler.map((g) => <span key={g.tarih} className="sg-chip">{new Date(`${g.tarih}T12:00:00`).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}{g.adet ? ' · adet' : ''}</span>)}</div></SoftPanel>}
      <Link href={`${basePath}/takip`} className="sg-back-link" style={{ margin: '0 16px' }}>← Takip</Link>
    </div>
  )
}
