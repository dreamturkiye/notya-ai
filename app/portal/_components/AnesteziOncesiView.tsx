'use client'
/**
 * ANESTEZI-EXCEPTIONAL-01 — Sağlığım › Anestezi Öncesi (hasta yüzü).
 * YASAK: tanı, ASA skor yorumu, ilaç dozu, ameliyathane makinesi.
 */
import Link from 'next/link'
import type { PortalAnestezi } from '@/lib/portal/types'
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

const ALT_BASLIK = 'Doktorunuzun belirlediği anestezi öncesi ve takip tarihleri. Yorum ve plan doktorunuzdadır.'

export function AnesteziOncesiView({ anestezi, basePath }: { anestezi: PortalAnestezi | null; basePath: string }) {
  if (!anestezi) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Anestezi Öncesi" subtitle={ALT_BASLIK} />
        <EmptyState art="takip" title="Henüz paylaşılan takip yok" body="Doktorunuz kontrol veya anestezi öncesi tarih kaydettiğinde burada görünür." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Özet</Link>
      </div>
    )
  }

  const bos = !anestezi.sonrakiKontrol && !anestezi.hatirlatmalar.length && !anestezi.preopHatirlatma.length && !anestezi.havaYoluHatirlatma.length && !anestezi.agriHatirlatma.length

  return (
    <div className="sg-fade">
      <SectionHeader title="Anestezi Öncesi" subtitle={ALT_BASLIK} />
      <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px 16px' }}>← Özet</Link>

      {bos && (
        <EmptyState art="takip" title="Henüz paylaşılan takip yok" body="Doktorunuz kontrol veya anestezi öncesi tarih kaydettiğinde burada görünür." />
      )}

      {anestezi.sonrakiKontrol && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Yaklaşan kontrol</Baslik>
          <div className="sg-goz-tarih">{uzunTarih(anestezi.sonrakiKontrol.tarih)}</div>
          <div className="sg-goz-meta">{anestezi.sonrakiKontrol.neden}</div>
        </SoftPanel>
      )}

      {anestezi.preopHatirlatma.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Anestezi öncesi değerlendirmeler</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {anestezi.preopHatirlatma.map((h, i) => (
              <li key={i}>{h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}</li>
            ))}
          </ul>
        </SoftPanel>
      )}

      {anestezi.havaYoluHatirlatma.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Hava yolu kontrolleri</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {anestezi.havaYoluHatirlatma.map((h, i) => (
              <li key={i}>{h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}</li>
            ))}
          </ul>
        </SoftPanel>
      )}

      {anestezi.agriHatirlatma.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Ağrı izlem kontrolleri</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {anestezi.agriHatirlatma.map((h, i) => (
              <li key={i}>{h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}</li>
            ))}
          </ul>
        </SoftPanel>
      )}

      {anestezi.hatirlatmalar.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Tüm hatırlatmalar</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {anestezi.hatirlatmalar.map((h, i) => (
              <li key={i}>
                {h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}
                {h.durum === 'gecikti' && <span className="sg-goz-meta"> · tarihi geçti</span>}
                {h.durum === 'yaklasiyor' && <span className="sg-goz-meta"> · yaklaşıyor</span>}
              </li>
            ))}
          </ul>
        </SoftPanel>
      )}

      {anestezi.ipuclari.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Genel öneriler</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {anestezi.ipuclari.map((x, i) => <li key={i}>{x}</li>)}
          </ul>
        </SoftPanel>
      )}

      <p className="sg-goz-meta" style={{ margin: '8px 20px 24px' }}>{anestezi.not}</p>
    </div>
  )
}
