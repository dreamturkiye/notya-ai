'use client'
/**
 * KARDIO-EXCEPTIONAL-01 — Sağlığım › Kalbim (hasta yüzü).
 * YASAK: tanı, SCORE2 %, risk bandı, ilaç, doz, NYHA, EF.
 */
import Link from 'next/link'
import type { PortalKalp } from '@/lib/portal/types'
import { EmptyState, SectionHeader, SoftPanel } from './ui'

function uzunTarih(iso: string): string {
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso)
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function Baslik({ children }: { children: React.ReactNode }) {
  return (
    <div className="sg-goz-baslik">
      <h2>{children}</h2>
    </div>
  )
}

const ALT_BASLIK = 'Doktorunuzun belirlediği kontrol ve hatırlatma tarihleri. Yorum ve plan doktorunuzdadır.'

export function KalbimView({ kalp, basePath }: { kalp: PortalKalp | null; basePath: string }) {
  if (!kalp) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Kalbim" subtitle={ALT_BASLIK} />
        <EmptyState art="takip" title="Henüz paylaşılan takip yok" body="Doktorunuz kontrol tarihi veya hatırlatma kaydettiğinde burada görünür." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Özet</Link>
      </div>
    )
  }

  const bos = !kalp.sonrakiKontrol && !kalp.hatirlatmalar.length && !kalp.olcumHatirlatma.length

  return (
    <div className="sg-fade">
      <SectionHeader title="Kalbim" subtitle={ALT_BASLIK} />
      <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px 16px' }}>← Özet</Link>

      {bos && (
        <EmptyState art="takip" title="Henüz paylaşılan takip yok" body="Doktorunuz kontrol tarihi veya hatırlatma kaydettiğinde burada görünür." />
      )}

      {kalp.sonrakiKontrol && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Yaklaşan kontrol</Baslik>
          <div className="sg-goz-tarih">{uzunTarih(kalp.sonrakiKontrol.tarih)}</div>
          <div className="sg-goz-meta">{kalp.sonrakiKontrol.neden}</div>
        </SoftPanel>
      )}

      {kalp.olcumHatirlatma.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Planlanan ölçüm ve testler</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {kalp.olcumHatirlatma.map((h, i) => (
              <li key={i}>{h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}</li>
            ))}
          </ul>
          <div className="sg-goz-meta" style={{ marginTop: 8 }}>
            Sonuçları doktorunuz değerlendirir ve muayenede sizinle konuşur.
          </div>
        </SoftPanel>
      )}

      {kalp.hatirlatmalar.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Tüm hatırlatmalar</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {kalp.hatirlatmalar.map((h, i) => (
              <li key={i}>
                {h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}
                {h.durum === 'gecikti' && <span className="sg-goz-meta"> · tarihi geçti</span>}
                {h.durum === 'yaklasiyor' && <span className="sg-goz-meta"> · yaklaşıyor</span>}
              </li>
            ))}
          </ul>
        </SoftPanel>
      )}

      {kalp.bakimIpuclari.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Kalp sağlığı ipuçları</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {kalp.bakimIpuclari.map((x, i) => <li key={i}>{x}</li>)}
          </ul>
        </SoftPanel>
      )}

      <div className="sg-goz-meta" style={{ margin: '12px 20px 24px' }}>{kalp.not}</div>
    </div>
  )
}
