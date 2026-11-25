'use client'
/**
 * HASTA-PORTALI-GUNLUK — internal demo: the doctor's "Ev verisi" card for the same synthetic patient the patient demo
 * (/portal/demo) shows. Example data only (lib/saglikEvi/demo.ts); nothing is fetched or saved.
 */
import { useMemo } from 'react'
import EvVerisiKarti from '@/components/doktor/saglikEvi/EvVerisiKarti'
import { evVerisiHesapla } from '@/lib/saglikEvi/evVerisi'
import { evVerisiDemoGirdisi } from '@/lib/saglikEvi/demo'
import { kontrolOncesiOzet } from '@/lib/saglikEvi/ozet'
import { etkinEsikler } from '@/lib/saglikEvi/hedefler'
import { CHROME_RENK as R } from '@/lib/doktor/chromeRenk'

export default function DemoHekimPage() {
  const veri = useMemo(() => {
    const simdi = new Date().toISOString()
    const g = evVerisiDemoGirdisi(simdi)
    const ozet = kontrolOncesiOzet({ olcumler: g.olcumler, planlar: g.planlar, kayitlar: g.kayitlar, uyarilar: g.uyarilar, sorular: g.sorular.map((s) => ({ metin: s.metin, createdAt: s.tarih })), esikler: etkinEsikler('genel', null), simdi, randevuAt: new Date(Date.now() + 86_400_000).toISOString() })
    return evVerisiHesapla({ ...g, kontrolOzeti: { id: 'demo', olusturmaAt: simdi, randevuAt: ozet.randevuAt, ozet, metin: ozet.metin } })
  }, [])
  return (
    <div style={{ minHeight: '100dvh', background: R.cream, padding: '24px 16px 48px' }}>
      <div style={{ maxWidth: 1040, margin: '0 auto' }}>
        <div role="note" style={{ marginBottom: 14, padding: '10px 12px', borderRadius: 10, background: '#FFF7E6', border: '1px solid #E8C98A', color: '#5b4300', fontSize: 13, lineHeight: 1.45 }}>
          <b>Örnek veri — hekim görünümü.</b> Hasta dosyasının Özet sekmesindeki “Ev verisi” kartı. Gerçek hasta bilgisi yoktur.
        </div>
        <h1 style={{ fontFamily: 'var(--sg-font-display)', fontWeight: 500, fontSize: 28, color: R.ink, margin: '0 0 14px' }}>Demo Hasta <span style={{ fontSize: 15, color: R.muted }}>· Dahiliye</span></h1>
        <EvVerisiKarti patientId="demo" ornek={veri} />
      </div>
    </div>
  )
}
