'use client'
/**
 * AILE-HEKIMLIGI-EXCEPTIONAL-01 — Sağlığım › Sağlık Paketim (hasta yüzü).
 * YASAK: tanı, skor, ilaç adı, doz, aşı lot, "diyabet/HT" klinik etiketi.
 */
import Link from 'next/link'
import type { PortalAile } from '@/lib/portal/types'
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

export function SaglikPaketimView({ aile, basePath }: { aile: PortalAile | null; basePath: string }) {
  if (!aile) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Sağlık Paketim" subtitle={ALT_BASLIK} />
        <EmptyState art="takip" title="Henüz paylaşılan takip yok" body="Doktorunuz kontrol tarihi veya hatırlatma kaydettiğinde burada görünür." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Özet</Link>
      </div>
    )
  }

  const bos = !aile.sonrakiKontrol && !aile.hatirlatmalar.length && !aile.asiTaramaHatirlatma.length && !aile.kronikHatirlatma.length

  return (
    <div className="sg-fade">
      <SectionHeader title="Sağlık Paketim" subtitle={ALT_BASLIK} />
      <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px 16px' }}>← Özet</Link>

      {bos && (
        <EmptyState art="takip" title="Henüz paylaşılan takip yok" body="Doktorunuz kontrol tarihi veya hatırlatma kaydettiğinde burada görünür." />
      )}

      {aile.sonrakiKontrol && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Yaklaşan kontrol</Baslik>
          <div className="sg-goz-tarih">{uzunTarih(aile.sonrakiKontrol.tarih)}</div>
          <div className="sg-goz-meta">{aile.sonrakiKontrol.neden}</div>
        </SoftPanel>
      )}

      {aile.asiTaramaHatirlatma.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Aşı veya tarama randevuları</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {aile.asiTaramaHatirlatma.map((h, i) => (
              <li key={i}>{h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}</li>
            ))}
          </ul>
          <div className="sg-goz-meta" style={{ marginTop: 8 }}>
            Tarihleri muayenehaneniz belirler; aşı ürünü ve doz doktorunuzdadır.
          </div>
        </SoftPanel>
      )}

      {aile.kronikHatirlatma.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Kronik takip kontrolleri</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {aile.kronikHatirlatma.map((h, i) => (
              <li key={i}>{h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}</li>
            ))}
          </ul>
        </SoftPanel>
      )}

      {aile.hatirlatmalar.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Tüm hatırlatmalar</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {aile.hatirlatmalar.map((h, i) => (
              <li key={i}>
                {h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}
                {h.durum === 'gecikti' && <span className="sg-goz-meta"> · tarihi geçti</span>}
                {h.durum === 'yaklasiyor' && <span className="sg-goz-meta"> · yaklaşıyor</span>}
              </li>
            ))}
          </ul>
        </SoftPanel>
      )}

      {aile.ipuclari.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Genel öneriler</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {aile.ipuclari.map((x, i) => <li key={i}>{x}</li>)}
          </ul>
        </SoftPanel>
      )}

      <p className="sg-goz-meta" style={{ margin: '16px 20px 8px' }}>{aile.not}</p>
    </div>
  )
}
