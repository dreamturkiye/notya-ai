'use client'
/**
 * FIZIK-TEDAVI-EXCEPTIONAL-01 — Sağlığım › FTR'm (hasta yüzü).
 * YASAK: tanı, VAS/ODI skoru/bandı, ilaç adı, doz, klinik etiket.
 */
import Link from 'next/link'
import type { PortalFtr } from '@/lib/portal/types'
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

const ALT_BASLIK = 'Doktorunuzun belirlediği kontrol, seans ve egzersiz hatırlatmaları. Yorum ve plan doktorunuzdadır.'

export function FtrmView({ ftr, basePath }: { ftr: PortalFtr | null; basePath: string }) {
  if (!ftr) {
    return (
      <div className="sg-fade">
        <SectionHeader title="FTR'm" subtitle={ALT_BASLIK} />
        <EmptyState art="takip" title="Henüz paylaşılan takip yok" body="Doktorunuz kontrol tarihi veya hatırlatma kaydettiğinde burada görünür." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Özet</Link>
      </div>
    )
  }

  const bos = !ftr.sonrakiKontrol && !ftr.hatirlatmalar.length && !ftr.seansHatirlatma.length && !ftr.egzersizHatirlatma.length

  return (
    <div className="sg-fade">
      <SectionHeader title="FTR'm" subtitle={ALT_BASLIK} />
      <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px 16px' }}>← Özet</Link>

      {bos && (
        <EmptyState art="takip" title="Henüz paylaşılan takip yok" body="Doktorunuz kontrol tarihi veya hatırlatma kaydettiğinde burada görünür." />
      )}

      {ftr.sonrakiKontrol && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Yaklaşan kontrol</Baslik>
          <div className="sg-goz-tarih">{uzunTarih(ftr.sonrakiKontrol.tarih)}</div>
          <div className="sg-goz-meta">{ftr.sonrakiKontrol.neden}</div>
        </SoftPanel>
      )}

      {ftr.seansHatirlatma.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Tedavi seansları</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {ftr.seansHatirlatma.map((h, i) => (
              <li key={i}>{h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}</li>
            ))}
          </ul>
        </SoftPanel>
      )}

      {ftr.egzersizHatirlatma.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Ev egzersiz / form hatırlatmaları</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {ftr.egzersizHatirlatma.map((h, i) => (
              <li key={i}>{h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}</li>
            ))}
          </ul>
          <div className="sg-goz-meta" style={{ marginTop: 8 }}>
            Form sonucunu doktorunuz değerlendirir ve muayenede sizinle konuşur.
          </div>
        </SoftPanel>
      )}

      {ftr.hatirlatmalar.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Tüm hatırlatmalar</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {ftr.hatirlatmalar.map((h, i) => (
              <li key={i}>
                {h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}
                {h.durum === 'gecikti' && <span className="sg-goz-meta"> · tarihi geçti</span>}
                {h.durum === 'yaklasiyor' && <span className="sg-goz-meta"> · yaklaşıyor</span>}
              </li>
            ))}
          </ul>
        </SoftPanel>
      )}

      {ftr.ipuclari.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Genel öneriler</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {ftr.ipuclari.map((x, i) => <li key={i}>{x}</li>)}
          </ul>
        </SoftPanel>
      )}

      <div className="sg-goz-meta" style={{ margin: '12px 20px 24px' }}>{ftr.not}</div>
    </div>
  )
}
