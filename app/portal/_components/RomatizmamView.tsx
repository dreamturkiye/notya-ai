'use client'
/**
 * ROMATOLOJI-EXCEPTIONAL-01 — Sağlığım › Romatizmam (hasta yüzü).
 * YASAK: tanı, DAS28/BASDAI sayı/bandı, ilaç adı, doz.
 */
import Link from 'next/link'
import type { PortalRoma } from '@/lib/portal/types'
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

export function RomatizmamView({ roma, basePath }: { roma: PortalRoma | null; basePath: string }) {
  if (!roma) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Romatizmam" subtitle={ALT_BASLIK} />
        <EmptyState art="takip" title="Henüz paylaşılan takip yok" body="Doktorunuz kontrol tarihi veya hatırlatma kaydettiğinde burada görünür." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Özet</Link>
      </div>
    )
  }

  const bos = !roma.sonrakiKontrol && !roma.hatirlatmalar.length && !roma.labHatirlatma.length && !roma.skorHatirlatma.length && !roma.belgeHatirlatma.length

  return (
    <div className="sg-fade">
      <SectionHeader title="Romatizmam" subtitle={ALT_BASLIK} />
      <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px 16px' }}>← Özet</Link>

      {bos && (
        <EmptyState art="takip" title="Henüz paylaşılan takip yok" body="Doktorunuz kontrol tarihi veya hatırlatma kaydettiğinde burada görünür." />
      )}

      {roma.sonrakiKontrol && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Yaklaşan kontrol</Baslik>
          <div className="sg-goz-tarih">{uzunTarih(roma.sonrakiKontrol.tarih)}</div>
          <div className="sg-goz-meta">{roma.sonrakiKontrol.neden}</div>
        </SoftPanel>
      )}

      {roma.labHatirlatma.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Kan tahlili kontrolleri</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {roma.labHatirlatma.map((h, i) => (
              <li key={i}>{h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}</li>
            ))}
          </ul>
          <div className="sg-goz-meta" style={{ marginTop: 8 }}>
            Sonuçları doktorunuz değerlendirir ve muayenede sizinle konuşur.
          </div>
        </SoftPanel>
      )}

      {roma.skorHatirlatma.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Eklem takip kontrolleri</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {roma.skorHatirlatma.map((h, i) => (
              <li key={i}>{h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}</li>
            ))}
          </ul>
        </SoftPanel>
      )}

      {roma.belgeHatirlatma.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Belge / rapor işlemleri</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {roma.belgeHatirlatma.map((h, i) => (
              <li key={i}>{h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}</li>
            ))}
          </ul>
        </SoftPanel>
      )}

      {roma.hatirlatmalar.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Tüm hatırlatmalar</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {roma.hatirlatmalar.map((h, i) => (
              <li key={i}>
                {h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}
                {h.durum === 'gecikti' && <span className="sg-goz-meta"> · tarihi geçti</span>}
                {h.durum === 'yaklasiyor' && <span className="sg-goz-meta"> · yaklaşıyor</span>}
              </li>
            ))}
          </ul>
        </SoftPanel>
      )}

      {roma.ipuclari.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Genel öneriler</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {roma.ipuclari.map((x, i) => <li key={i}>{x}</li>)}
          </ul>
        </SoftPanel>
      )}

      <p className="sg-goz-meta" style={{ margin: '8px 20px 24px' }}>{roma.not}</p>
    </div>
  )
}
