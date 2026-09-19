'use client'
/**
 * NEFROLOJI-EXCEPTIONAL-01 — Sağlığım › Böbreklerim (hasta yüzü).
 * YASAK: tanı, eGFR/KDIGO sayı/evresi, ilaç adı, ESA dozu, "KBH".
 */
import Link from 'next/link'
import type { PortalNef } from '@/lib/portal/types'
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

export function BobreklerimView({ nef, basePath }: { nef: PortalNef | null; basePath: string }) {
  if (!nef) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Böbreklerim" subtitle={ALT_BASLIK} />
        <EmptyState art="takip" title="Henüz paylaşılan takip yok" body="Doktorunuz kontrol tarihi veya hatırlatma kaydettiğinde burada görünür." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Özet</Link>
      </div>
    )
  }

  const bos = !nef.sonrakiKontrol && !nef.hatirlatmalar.length && !nef.labHatirlatma.length && !nef.anemiHatirlatma.length && !nef.diyalizHatirlatma.length

  return (
    <div className="sg-fade">
      <SectionHeader title="Böbreklerim" subtitle={ALT_BASLIK} />
      <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px 16px' }}>← Özet</Link>

      {bos && (
        <EmptyState art="takip" title="Henüz paylaşılan takip yok" body="Doktorunuz kontrol tarihi veya hatırlatma kaydettiğinde burada görünür." />
      )}

      {nef.sonrakiKontrol && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Yaklaşan kontrol</Baslik>
          <div className="sg-goz-tarih">{uzunTarih(nef.sonrakiKontrol.tarih)}</div>
          <div className="sg-goz-meta">{nef.sonrakiKontrol.neden}</div>
        </SoftPanel>
      )}

      {nef.labHatirlatma.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Kan tahlili kontrolleri</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {nef.labHatirlatma.map((h, i) => (
              <li key={i}>{h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}</li>
            ))}
          </ul>
          <div className="sg-goz-meta" style={{ marginTop: 8 }}>
            Sonuçları doktorunuz değerlendirir ve muayenede sizinle konuşur.
          </div>
        </SoftPanel>
      )}

      {nef.anemiHatirlatma.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Kan sayımı kontrolleri</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {nef.anemiHatirlatma.map((h, i) => (
              <li key={i}>{h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}</li>
            ))}
          </ul>
        </SoftPanel>
      )}

      {nef.diyalizHatirlatma.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Diyaliz seans / takip</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {nef.diyalizHatirlatma.map((h, i) => (
              <li key={i}>{h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}</li>
            ))}
          </ul>
        </SoftPanel>
      )}

      {nef.hatirlatmalar.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Tüm hatırlatmalar</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {nef.hatirlatmalar.map((h, i) => (
              <li key={i}>
                {h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}
                {h.durum === 'gecikti' && <span className="sg-goz-meta"> · tarihi geçti</span>}
                {h.durum === 'yaklasiyor' && <span className="sg-goz-meta"> · yaklaşıyor</span>}
              </li>
            ))}
          </ul>
        </SoftPanel>
      )}

      {nef.ipuclari.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Hatırlatmalar</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {nef.ipuclari.map((x, i) => <li key={i}>{x}</li>)}
          </ul>
        </SoftPanel>
      )}

      <p className="sg-goz-meta" style={{ margin: '12px 20px 24px' }}>{nef.not}</p>
    </div>
  )
}
