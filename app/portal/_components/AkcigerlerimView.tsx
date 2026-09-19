'use client'
/**
 * GOGUS-EXCEPTIONAL-01 — Sağlığım › Akciğerlerim (hasta yüzü).
 * YASAK: tanı, CAT/mMRC, GOLD, FEV1, ilaç, doz.
 */
import Link from 'next/link'
import type { PortalAkciger } from '@/lib/portal/types'
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

export function AkcigerlerimView({ akciger, basePath }: { akciger: PortalAkciger | null; basePath: string }) {
  if (!akciger) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Akciğerlerim" subtitle={ALT_BASLIK} />
        <EmptyState art="takip" title="Henüz paylaşılan takip yok" body="Doktorunuz kontrol tarihi veya hatırlatma kaydettiğinde burada görünür." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Özet</Link>
      </div>
    )
  }

  const bos = !akciger.sonrakiKontrol && !akciger.hatirlatmalar.length && !akciger.testHatirlatma.length && !akciger.bakimHatirlatma.length

  return (
    <div className="sg-fade">
      <SectionHeader title="Akciğerlerim" subtitle={ALT_BASLIK} />
      <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px 16px' }}>← Özet</Link>

      {bos && (
        <EmptyState art="takip" title="Henüz paylaşılan takip yok" body="Doktorunuz kontrol tarihi veya hatırlatma kaydettiğinde burada görünür." />
      )}

      {akciger.sonrakiKontrol && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Yaklaşan kontrol</Baslik>
          <div className="sg-goz-tarih">{uzunTarih(akciger.sonrakiKontrol.tarih)}</div>
          <div className="sg-goz-meta">{akciger.sonrakiKontrol.neden}</div>
        </SoftPanel>
      )}

      {akciger.testHatirlatma.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Planlanan testler</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {akciger.testHatirlatma.map((h, i) => (
              <li key={i}>{h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}</li>
            ))}
          </ul>
          <div className="sg-goz-meta" style={{ marginTop: 8 }}>
            Test sonucunu doktorunuz değerlendirir ve muayenede sizinle konuşur.
          </div>
        </SoftPanel>
      )}

      {akciger.bakimHatirlatma.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Bakım ve eğitim randevuları</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {akciger.bakimHatirlatma.map((h, i) => (
              <li key={i}>{h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}</li>
            ))}
          </ul>
        </SoftPanel>
      )}

      {akciger.hatirlatmalar.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Tüm hatırlatmalar</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {akciger.hatirlatmalar.map((h, i) => (
              <li key={i}>
                {h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}
                {h.durum === 'gecikti' && <span className="sg-goz-meta"> · tarihi geçti</span>}
                {h.durum === 'yaklasiyor' && <span className="sg-goz-meta"> · yaklaşıyor</span>}
              </li>
            ))}
          </ul>
        </SoftPanel>
      )}

      {akciger.bakimIpuclari.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Solunum bakımı</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {akciger.bakimIpuclari.map((x, i) => <li key={i}>{x}</li>)}
          </ul>
        </SoftPanel>
      )}

      <div className="sg-goz-meta" style={{ margin: '12px 20px 24px' }}>{akciger.not}</div>
    </div>
  )
}
