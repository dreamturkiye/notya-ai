'use client'
/**
 * UROLOJI-EXCEPTIONAL-01 — Sağlığım › Ürolojimm (hasta yüzü).
 * YASAK: tanı, PSA sayı, IPSS skor, doz, kanser.
 */
import Link from 'next/link'
import type { PortalUro } from '@/lib/portal/types'
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

export function UrolojimView({ uro, basePath }: { uro: PortalUro | null; basePath: string }) {
  if (!uro) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Ürolojimm" subtitle={ALT_BASLIK} />
        <EmptyState art="takip" title="Henüz paylaşılan takip yok" body="Doktorunuz kontrol tarihi veya hatırlatma kaydettiğinde burada görünür." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Özet</Link>
      </div>
    )
  }

  const bos = !uro.sonrakiKontrol && !uro.hatirlatmalar.length && !uro.testHatirlatma.length && !uro.islemHatirlatma.length

  return (
    <div className="sg-fade">
      <SectionHeader title="Ürolojimm" subtitle={ALT_BASLIK} />
      <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px 16px' }}>← Özet</Link>

      {bos && (
        <EmptyState art="takip" title="Henüz paylaşılan takip yok" body="Doktorunuz kontrol tarihi veya hatırlatma kaydettiğinde burada görünür." />
      )}

      {uro.sonrakiKontrol && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Yaklaşan kontrol</Baslik>
          <div className="sg-goz-tarih">{uzunTarih(uro.sonrakiKontrol.tarih)}</div>
          <div className="sg-goz-meta">{uro.sonrakiKontrol.neden}</div>
        </SoftPanel>
      )}

      {uro.testHatirlatma.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Planlanan formlar ve testler</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {uro.testHatirlatma.map((h, i) => (
              <li key={i}>{h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}</li>
            ))}
          </ul>
          <div className="sg-goz-meta" style={{ marginTop: 8 }}>
            Sonuçları doktorunuz değerlendirir ve muayenede sizinle konuşur.
          </div>
        </SoftPanel>
      )}

      {uro.islemHatirlatma.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>İşlem ve belge randevuları</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {uro.islemHatirlatma.map((h, i) => (
              <li key={i}>{h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}</li>
            ))}
          </ul>
        </SoftPanel>
      )}

      {uro.hatirlatmalar.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Tüm hatırlatmalar</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {uro.hatirlatmalar.map((h, i) => (
              <li key={i}>
                {h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}
                {h.durum === 'gecikti' && <span className="sg-goz-meta"> · tarihi geçti</span>}
                {h.durum === 'yaklasiyor' && <span className="sg-goz-meta"> · yaklaşıyor</span>}
              </li>
            ))}
          </ul>
        </SoftPanel>
      )}

      {uro.bakimIpuclari.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Genel öneriler</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {uro.bakimIpuclari.map((x, i) => <li key={i}>{x}</li>)}
          </ul>
        </SoftPanel>
      )}

      <p className="sg-goz-meta" style={{ margin: '16px 20px' }}>{uro.not}</p>
    </div>
  )
}
