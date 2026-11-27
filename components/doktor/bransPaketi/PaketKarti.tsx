'use client'
/**
 * BRANS-PAKETI Phase 2 — the package tile in the patient file (Özet; core: every branş with a package). The doctor sees
 * at a glance: the patient's journey (day N of M), what is open today, the last 7 days of activity and the flagged
 * entries of the last 14 days (word + icon from the shared alert palette, never colour alone). Diary content only after
 * the patient's sharing consent (same rule as Ev verisi). Loaded on demand (next/dynamic from the patient-file page; its
 * own lean request — never part of the patient-file payload, performans-butcesi-koruma). Renders nothing when the
 * doctor's branş has no package. Data: GET /api/ozel-brans/paket/hasta?patientId=&ozet=1 (hastaSahibiMi-gated).
 */
import { useEffect, useState } from 'react'
import { CHROME_RENK as R, CHROME_FONT as F } from '@/lib/doktor/chromeRenk'
import { doktorFetch } from '@/lib/doktor/oturumFetch'
import { UyariIsareti } from '@/components/doktor/saglikEvi/UyariIsareti'

type Ozet = {
  brans: string | null; ad: string | null; yonetim?: string; aktif: number; hazirlaniyor: number; sablonBekleyen: number; paylasimOnayi: boolean
  ogeler: Array<{ baslik: string; tur: string; metin: string; tamam: boolean; ilerleme: { n: number; m: number; etiket: string } | null }>
  son7Gun: number | null; sonKayit: string | null; foto30Gun: number
  bayraklar: Array<{ gun: string; seviye: 'acil' | 'hekime_bildir' | 'dikkat'; modul: string; metin: string | null }>
}

const tarih = (iso: string | null) => (iso ? new Date(`${iso}T12:00:00`).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' }) : '')
const ETIKET = { acil: 'Acil', hekime_bildir: 'Bildirim', dikkat: 'Dikkat' } as const

export default function PaketKarti({ patientId }: { patientId: string }) {
  const [v, setV] = useState<Ozet | null>(null)
  useEffect(() => {
    let iptal = false
    doktorFetch(`/api/ozel-brans/paket/hasta?patientId=${encodeURIComponent(patientId)}&ozet=1`, {})
      .then((r) => (r.ok ? r.json() : null)).then((j) => { if (!iptal && j) setV(j as Ozet) }).catch(() => undefined)
    return () => { iptal = true }
  }, [patientId])
  if (!v || !v.brans) return null
  const yonet = `${v.yonetim || '/dashboard/doktor/ayarlar/hasta-alani-paketi'}?patientId=${encodeURIComponent(patientId)}`
  const yolculuk = v.ogeler.find((o) => o.tur === 'zaman' && o.ilerleme)
  return (
    <section data-paket-karti={v.brans} style={{ background: '#fffdf9', border: `1px solid ${R.border}`, borderRadius: 22, padding: '20px 22px', fontFamily: F.sans, color: R.ink, display: 'grid', gap: 12, alignContent: 'start' }} aria-labelledby="paket-karti-b">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
        <h2 id="paket-karti-b" style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{v.ad}<span style={{ fontWeight: 500, color: R.muted, marginLeft: 8, fontSize: 13.5 }}>Hasta alanı paketi</span></h2>
        <a href={yonet} style={{ fontSize: 13.5, fontWeight: 600, color: R.pine, textDecoration: 'none', padding: '6px 0' }}>Yönet</a>
      </div>
      {v.aktif === 0 ? (
        <p style={{ margin: 0, fontSize: 14, color: R.muted, lineHeight: 1.5 }}>
          {v.sablonBekleyen > 0 ? `${v.sablonBekleyen} şablon kabulünüzü bekliyor. Kabul ettiğinizde bu hastanın Sağlığım sayfasında açılır.` : 'Bu hasta için açık modül yok. Modülleri hasta bazında açabilirsiniz.'}
        </p>
      ) : (
        <>
          {yolculuk?.ilerleme && (
            <div>
              <div style={{ fontFamily: F.serif, fontSize: 26, lineHeight: 1.1 }}>{yolculuk.ilerleme.etiket}<span style={{ fontFamily: F.sans, fontSize: 13, color: R.muted, marginLeft: 8 }}>{yolculuk.baslik}</span></div>
              <div style={{ height: 5, borderRadius: 5, background: '#ece5d8', margin: '10px 0 8px', overflow: 'hidden' }} role="progressbar" aria-valuemin={0} aria-valuemax={yolculuk.ilerleme.m} aria-valuenow={yolculuk.ilerleme.n} aria-label={yolculuk.baslik}>
                <div style={{ width: `${Math.round((yolculuk.ilerleme.n / yolculuk.ilerleme.m) * 100)}%`, height: '100%', background: R.pine }} />
              </div>
              <p style={{ margin: 0, fontSize: 14 }}>{yolculuk.metin}</p>
            </div>
          )}
          <p style={{ margin: 0, fontSize: 13.5, color: R.muted, lineHeight: 1.5 }}>
            {v.aktif} modül açık{v.hazirlaniyor ? `, ${v.hazirlaniyor} modül şablon kabulü bekliyor` : ''}.{' '}
            {v.paylasimOnayi
              ? (v.son7Gun ? `Son 7 günde ${v.son7Gun} kayıt; son kayıt ${tarih(v.sonKayit)}.` : 'Son 7 günde kayıt yok.')
              : 'Hasta paylaşım onayı vermedi; günlük kayıtları görünmez (acil uyarılar hastaya her durumda gösterilir).'}
            {v.foto30Gun ? ` Son 30 günde ${v.foto30Gun} fotoğraf.` : ''}
          </p>
          {v.bayraklar.length > 0 && (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }} aria-label="Bayraklı kayıtlar">
              {v.bayraklar.slice(0, 4).map((b, i) => (
                <li key={i} style={{ display: 'grid', gap: 3 }}>
                  <span style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}><UyariIsareti ton={b.seviye} etiket={ETIKET[b.seviye]} kucuk /><span style={{ fontSize: 13, color: R.muted }}>{tarih(b.gun)}, {b.modul}</span></span>
                  {b.metin ? <span style={{ fontSize: 13.5, lineHeight: 1.45 }}>{b.metin}</span> : null}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  )
}
