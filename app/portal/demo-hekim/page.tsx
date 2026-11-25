'use client'
/**
 * HASTA-PORTALI-GUNLUK — internal demo: the doctor's "Ev verisi" card for the same synthetic patient the patient demo
 * (/portal/demo) shows. Example data only (lib/saglikEvi/demo.ts); nothing is fetched or saved.
 * EV-VERISI-V2: ?durum=sakin | az | bos | onaysiz | kullanmiyor previews the card's other states with the same patient.
 */
import { useEffect, useMemo, useState } from 'react'
import EvVerisiKarti from '@/components/doktor/saglikEvi/EvVerisiKarti'
import { evVerisiHesapla, type EvVerisiGirdisi } from '@/lib/saglikEvi/evVerisi'
import { evVerisiDemoGirdisi } from '@/lib/saglikEvi/demo'
import { kontrolOncesiOzet } from '@/lib/saglikEvi/ozet'
import { etkinEsikler } from '@/lib/saglikEvi/hedefler'
import { CHROME_RENK as R, CHROME_FONT, CHROME_FONT_HREF } from '@/lib/doktor/chromeRenk'

function durumaGore(g: EvVerisiGirdisi, durum: string | null, simdiMs: number): EvVerisiGirdisi {
  if (durum === 'sakin') return { ...g, uyarilar: g.uyarilar.map((u) => ({ ...u, hekimGorduAt: new Date(simdiMs).toISOString() })) }
  if (durum === 'az') return { ...g, uyarilar: [], olcumler: g.olcumler.filter((o) => Date.parse(o.olcumAt) > simdiMs - 2.2 * 86_400_000) }
  if (durum === 'bos') return { ...g, uyarilar: [], olcumler: [], kayitlar: [], planlar: [], sorular: [] }
  if (durum === 'onaysiz') return { ...g, tercih: { ...g.tercih, paylasimOnayi: false } }
  if (durum === 'kullanmiyor') return { ...g, tercih: { ...g.tercih, paylasimOnayi: false }, olcumler: [], kayitlar: [], planlar: g.planlar.filter((p) => p.kaynak !== 'hasta') }
  return g
}

export default function DemoHekimPage() {
  // Read after mount: the example is computed in the browser only (no server/client time or URL mismatch).
  const [durum, setDurum] = useState<string | null | undefined>(undefined)
  useEffect(() => { setDurum(new URLSearchParams(window.location.search).get('durum')) }, [])
  const veri = useMemo(() => {
    if (durum === undefined) return null
    const simdi = new Date().toISOString()
    const g = durumaGore(evVerisiDemoGirdisi(simdi), durum, Date.parse(simdi))
    const ozet = kontrolOncesiOzet({ olcumler: g.olcumler, planlar: g.planlar, kayitlar: g.kayitlar, uyarilar: g.uyarilar, sorular: g.sorular.map((s) => ({ metin: s.metin, createdAt: s.tarih })), esikler: etkinEsikler('genel', null), simdi, randevuAt: new Date(Date.now() + 86_400_000).toISOString() })
    return evVerisiHesapla({ ...g, kontrolOzeti: { id: 'demo', olusturmaAt: simdi, randevuAt: ozet.randevuAt, ozet, metin: ozet.metin } })
  }, [durum])
  return (
    <div style={{ minHeight: '100dvh', background: R.cream, padding: '24px 16px 48px', fontFamily: CHROME_FONT.sans }}>
      {/* The patient file loads the same fonts through app/dashboard/doktor/layout.tsx. */}
      <link rel="stylesheet" href={CHROME_FONT_HREF} />
      <div style={{ maxWidth: 1040, margin: '0 auto' }}>
        <div role="note" style={{ marginBottom: 14, padding: '10px 12px', borderRadius: 10, background: '#FFF7E6', border: '1px solid #E8C98A', color: '#5b4300', fontSize: 13, lineHeight: 1.45 }}>
          <b>Örnek veri — hekim görünümü.</b> Hasta dosyasının Özet sekmesindeki “Ev verisi” kartı. Gerçek hasta bilgisi yoktur.
        </div>
        <h1 style={{ fontFamily: CHROME_FONT.serif, fontWeight: 480, fontSize: 28, color: R.ink, margin: '0 0 14px' }}>Demo Hasta <span style={{ fontSize: 15, color: R.muted, fontFamily: CHROME_FONT.sans }}>· Dahiliye</span></h1>
        {veri ? <EvVerisiKarti patientId="demo" ornek={veri} /> : null}
      </div>
    </div>
  )
}
