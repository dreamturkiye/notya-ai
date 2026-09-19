'use client'
/**
 * ACIL-TIP-EXCEPTIONAL-01 — Sağlığım › Acil sonrası takip (hasta yüzü).
 * YASAK: tanı, doz, ESI sayı, STEMI/inme skoru, bed board.
 * ED hastalarında uzun portal döngüsü yoktur — Strong ama dürüst.
 */
import Link from 'next/link'
import type { PortalAcilSonrasi } from '@/lib/portal/types'
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

const ALT_BASLIK = 'Doktorunuzun belirlediği acil sonrası kontrol tarihleri. Yorum ve plan doktorunuzdadır.'

export function AcilSonrasiView({ acilSonrasi, basePath }: { acilSonrasi: PortalAcilSonrasi | null; basePath: string }) {
  if (!acilSonrasi) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Acil sonrası takip" subtitle={ALT_BASLIK} />
        <EmptyState art="takip" title="Henüz paylaşılan takip yok" body="Doktorunuz kontrol tarihi kaydettiğinde burada görünür." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Özet</Link>
      </div>
    )
  }

  const bos = !acilSonrasi.sonrakiKontrol && !acilSonrasi.hatirlatmalar.length && !acilSonrasi.taburcuHatirlatma.length && !acilSonrasi.takipHatirlatma.length && !acilSonrasi.sevkHatirlatma.length

  return (
    <div className="sg-fade">
      <SectionHeader title="Acil sonrası takip" subtitle={ALT_BASLIK} />
      <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px 16px' }}>← Özet</Link>

      {bos && (
        <EmptyState art="takip" title="Henüz paylaşılan takip yok" body="Doktorunuz kontrol tarihi kaydettiğinde burada görünür." />
      )}

      {acilSonrasi.sonrakiKontrol && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Yaklaşan kontrol</Baslik>
          <div className="sg-goz-tarih">{uzunTarih(acilSonrasi.sonrakiKontrol.tarih)}</div>
          <div className="sg-goz-meta">{acilSonrasi.sonrakiKontrol.neden}</div>
        </SoftPanel>
      )}

      {acilSonrasi.taburcuHatirlatma.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Acil sonrası kontroller</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {acilSonrasi.taburcuHatirlatma.map((h, i) => (
              <li key={i}>{h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}</li>
            ))}
          </ul>
        </SoftPanel>
      )}

      {acilSonrasi.takipHatirlatma.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Takip kontrolleri</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {acilSonrasi.takipHatirlatma.map((h, i) => (
              <li key={i}>{h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}</li>
            ))}
          </ul>
        </SoftPanel>
      )}

      {acilSonrasi.sevkHatirlatma.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Sevk / yatış takibi</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {acilSonrasi.sevkHatirlatma.map((h, i) => (
              <li key={i}>{h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}</li>
            ))}
          </ul>
        </SoftPanel>
      )}

      {acilSonrasi.hatirlatmalar.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Tüm hatırlatmalar</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {acilSonrasi.hatirlatmalar.map((h, i) => (
              <li key={i}>
                {h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}
                {h.durum === 'gecikti' && <span className="sg-goz-meta"> · tarihi geçti</span>}
                {h.durum === 'yaklasiyor' && <span className="sg-goz-meta"> · yaklaşıyor</span>}
              </li>
            ))}
          </ul>
        </SoftPanel>
      )}

      {acilSonrasi.ipuclari.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Hatırlatmalar</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {acilSonrasi.ipuclari.map((x, i) => <li key={i}>{x}</li>)}
          </ul>
        </SoftPanel>
      )}

      <p className="sg-goz-meta" style={{ margin: '12px 20px 24px' }}>{acilSonrasi.not}</p>
    </div>
  )
}
