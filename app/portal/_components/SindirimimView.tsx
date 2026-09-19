'use client'
/**
 * GASTROENTEROLOJI-EXCEPTIONAL-01 — Sağlığım › Sindirimim (hasta yüzü).
 * YASAK: tanı, skor/band, ilaç adı, doz, "Crohn/ÜK/HBV".
 */
import Link from 'next/link'
import type { PortalGastro } from '@/lib/portal/types'
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

export function SindirimimView({ gastro, basePath }: { gastro: PortalGastro | null; basePath: string }) {
  if (!gastro) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Sindirimim" subtitle={ALT_BASLIK} />
        <EmptyState art="takip" title="Henüz paylaşılan takip yok" body="Doktorunuz kontrol tarihi veya hatırlatma kaydettiğinde burada görünür." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Özet</Link>
      </div>
    )
  }

  const bos = !gastro.sonrakiKontrol && !gastro.hatirlatmalar.length && !gastro.skorHatirlatma.length && !gastro.hepatitHatirlatma.length && !gastro.endoskopiHatirlatma.length && !gastro.rejimHatirlatma.length

  return (
    <div className="sg-fade">
      <SectionHeader title="Sindirimim" subtitle={ALT_BASLIK} />
      <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px 16px' }}>← Özet</Link>

      {bos && (
        <EmptyState art="takip" title="Henüz paylaşılan takip yok" body="Doktorunuz kontrol tarihi veya hatırlatma kaydettiğinde burada görünür." />
      )}

      {gastro.sonrakiKontrol && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Yaklaşan kontrol</Baslik>
          <div className="sg-goz-tarih">{uzunTarih(gastro.sonrakiKontrol.tarih)}</div>
          <div className="sg-goz-meta">{gastro.sonrakiKontrol.neden}</div>
        </SoftPanel>
      )}

      {gastro.skorHatirlatma.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Takip formu kontrolleri</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {gastro.skorHatirlatma.map((h, i) => (
              <li key={i}>{h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}</li>
            ))}
          </ul>
          <div className="sg-goz-meta" style={{ marginTop: 8 }}>
            Form sonuçlarını doktorunuz değerlendirir ve muayenede sizinle konuşur.
          </div>
        </SoftPanel>
      )}

      {gastro.hepatitHatirlatma.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Kan tahlili kontrolleri</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {gastro.hepatitHatirlatma.map((h, i) => (
              <li key={i}>{h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}</li>
            ))}
          </ul>
        </SoftPanel>
      )}

      {gastro.endoskopiHatirlatma.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Endoskopi kontrolleri</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {gastro.endoskopiHatirlatma.map((h, i) => (
              <li key={i}>{h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}</li>
            ))}
          </ul>
        </SoftPanel>
      )}

      {gastro.rejimHatirlatma.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Tedavi kontrol tarihleri</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {gastro.rejimHatirlatma.map((h, i) => (
              <li key={i}>{h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}</li>
            ))}
          </ul>
        </SoftPanel>
      )}

      {gastro.hatirlatmalar.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Tüm hatırlatmalar</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {gastro.hatirlatmalar.map((h, i) => (
              <li key={i}>
                {h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}
                {h.durum === 'gecikti' && <span className="sg-goz-meta"> · tarihi geçti</span>}
                {h.durum === 'yaklasiyor' && <span className="sg-goz-meta"> · yaklaşıyor</span>}
              </li>
            ))}
          </ul>
        </SoftPanel>
      )}

      {gastro.ipuclari.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Genel öneriler</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {gastro.ipuclari.map((x, i) => <li key={i}>{x}</li>)}
          </ul>
        </SoftPanel>
      )}

      <p className="sg-goz-meta" style={{ margin: '8px 20px 24px' }}>{gastro.not}</p>
    </div>
  )
}
