'use client'
/**
 * SPOR-HEKIMLIGI-EXCEPTIONAL-01 — Sağlığım › Sporum (hasta yüzü).
 * YASAK: tanı, doz, doping, klinik skor yorumu.
 */
import Link from 'next/link'
import type { PortalSpor } from '@/lib/portal/types'
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

const ALT_BASLIK = 'Doktorunuzun belirlediği kontrol ve antrenmana dönüş planı hatırlatmaları. Yorum ve plan doktorunuzdadır.'

export function SporumView({ spor, basePath }: { spor: PortalSpor | null; basePath: string }) {
  if (!spor) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Sporum" subtitle={ALT_BASLIK} />
        <EmptyState art="takip" title="Henüz paylaşılan takip yok" body="Doktorunuz kontrol tarihi veya hatırlatma kaydettiğinde burada görünür." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Özet</Link>
      </div>
    )
  }

  const bos = !spor.sonrakiKontrol && !spor.hatirlatmalar.length && !spor.planHatirlatma.length && !spor.rtpOzet

  return (
    <div className="sg-fade">
      <SectionHeader title="Sporum" subtitle={ALT_BASLIK} />
      <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px 16px' }}>← Özet</Link>

      {bos && (
        <EmptyState art="takip" title="Henüz paylaşılan takip yok" body="Doktorunuz kontrol tarihi veya hatırlatma kaydettiğinde burada görünür." />
      )}

      {spor.sonrakiKontrol && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Yaklaşan kontrol</Baslik>
          <div className="sg-goz-tarih">{uzunTarih(spor.sonrakiKontrol.tarih)}</div>
          <div className="sg-goz-meta">{spor.sonrakiKontrol.neden}</div>
        </SoftPanel>
      )}

      {spor.rtpOzet && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Antrenmana dönüş planı</Baslik>
          <div className="sg-goz-meta">{spor.rtpOzet}</div>
        </SoftPanel>
      )}

      {spor.planHatirlatma.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Plan ve izlem hatırlatmaları</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {spor.planHatirlatma.map((h, i) => (
              <li key={i}>{h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}</li>
            ))}
          </ul>
        </SoftPanel>
      )}

      {spor.hatirlatmalar.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Tüm hatırlatmalar</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {spor.hatirlatmalar.map((h, i) => (
              <li key={i}>
                {h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}
                {h.durum === 'gecikti' && <span className="sg-goz-meta"> · tarihi geçti</span>}
                {h.durum === 'yaklasiyor' && <span className="sg-goz-meta"> · yaklaşıyor</span>}
              </li>
            ))}
          </ul>
        </SoftPanel>
      )}

      {spor.bakimIpuclari.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Genel öneriler</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {spor.bakimIpuclari.map((x, i) => <li key={i}>{x}</li>)}
          </ul>
        </SoftPanel>
      )}

      <p className="sg-goz-meta" style={{ margin: '12px 20px 0' }}>{spor.not}</p>
    </div>
  )
}
