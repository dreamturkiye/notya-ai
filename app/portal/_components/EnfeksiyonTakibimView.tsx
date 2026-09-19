'use client'
/**
 * ENFEKSIYON-EXCEPTIONAL-01 — Sağlığım › Enfeksiyon Takibim (hasta yüzü).
 * YASAK: tanı, CD4/viral sayı, ilaç adı, doz.
 */
import Link from 'next/link'
import type { PortalEnfeksiyon } from '@/lib/portal/types'
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

export function EnfeksiyonTakibimView({ enfeksiyon, basePath }: { enfeksiyon: PortalEnfeksiyon | null; basePath: string }) {
  if (!enfeksiyon) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Enfeksiyon Takibim" subtitle={ALT_BASLIK} />
        <EmptyState art="takip" title="Henüz paylaşılan takip yok" body="Doktorunuz kontrol tarihi veya hatırlatma kaydettiğinde burada görünür." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Özet</Link>
      </div>
    )
  }

  const bos = !enfeksiyon.sonrakiKontrol && !enfeksiyon.hatirlatmalar.length && !enfeksiyon.viralHatirlatma.length && !enfeksiyon.atbHatirlatma.length && !enfeksiyon.izolasyonHatirlatma.length

  return (
    <div className="sg-fade">
      <SectionHeader title="Enfeksiyon Takibim" subtitle={ALT_BASLIK} />
      <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px 16px' }}>← Özet</Link>

      {bos && (
        <EmptyState art="takip" title="Henüz paylaşılan takip yok" body="Doktorunuz kontrol tarihi veya hatırlatma kaydettiğinde burada görünür." />
      )}

      {enfeksiyon.sonrakiKontrol && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Yaklaşan kontrol</Baslik>
          <div className="sg-goz-tarih">{uzunTarih(enfeksiyon.sonrakiKontrol.tarih)}</div>
          <div className="sg-goz-meta">{enfeksiyon.sonrakiKontrol.neden}</div>
        </SoftPanel>
      )}

      {enfeksiyon.viralHatirlatma.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Kan tahlili kontrolleri</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {enfeksiyon.viralHatirlatma.map((h, i) => (
              <li key={i}>{h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}</li>
            ))}
          </ul>
          <div className="sg-goz-meta" style={{ marginTop: 8 }}>
            Sonuçları doktorunuz değerlendirir ve muayenede sizinle konuşur.
          </div>
        </SoftPanel>
      )}

      {enfeksiyon.atbHatirlatma.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>İlaç süre kontrolleri</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {enfeksiyon.atbHatirlatma.map((h, i) => (
              <li key={i}>{h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}</li>
            ))}
          </ul>
        </SoftPanel>
      )}

      {enfeksiyon.izolasyonHatirlatma.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>İzolasyon / takip kontrolleri</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {enfeksiyon.izolasyonHatirlatma.map((h, i) => (
              <li key={i}>{h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}</li>
            ))}
          </ul>
        </SoftPanel>
      )}

      {enfeksiyon.hatirlatmalar.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Tüm hatırlatmalar</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {enfeksiyon.hatirlatmalar.map((h, i) => (
              <li key={i}>
                {h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}
                {h.durum === 'gecikti' && <span className="sg-goz-meta"> · tarihi geçti</span>}
                {h.durum === 'yaklasiyor' && <span className="sg-goz-meta"> · yaklaşıyor</span>}
              </li>
            ))}
          </ul>
        </SoftPanel>
      )}

      {enfeksiyon.ipuclari.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Genel öneriler</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {enfeksiyon.ipuclari.map((x, i) => <li key={i}>{x}</li>)}
          </ul>
        </SoftPanel>
      )}

      <p className="sg-goz-meta" style={{ margin: '8px 20px 24px' }}>{enfeksiyon.not}</p>
    </div>
  )
}
