'use client'
/**
 * ONKOLOJI-EXCEPTIONAL-01 — Sağlığım › Tedavim (hasta yüzü).
 * YASAK: tanı, evre/stage/TNM, ilaç adı, doz, "kanser/tümör/metastaz".
 */
import Link from 'next/link'
import type { PortalOnko } from '@/lib/portal/types'
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

const ALT_BASLIK = 'Doktorunuzun belirlediği kontrol ve tedavi günü tarihleri. Yorum ve plan doktorunuzdadır.'

export function TedavimView({ onko, basePath }: { onko: PortalOnko | null; basePath: string }) {
  if (!onko) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Tedavim" subtitle={ALT_BASLIK} />
        <EmptyState art="takip" title="Henüz paylaşılan takip yok" body="Doktorunuz kontrol veya tedavi günü kaydettiğinde burada görünür." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Özet</Link>
      </div>
    )
  }

  const bos = !onko.sonrakiKontrol && !onko.hatirlatmalar.length && !onko.kurHatirlatma.length && !onko.labHatirlatma.length && !onko.yanEtkiHatirlatma.length

  return (
    <div className="sg-fade">
      <SectionHeader title="Tedavim" subtitle={ALT_BASLIK} />
      <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px 16px' }}>← Özet</Link>

      {bos && (
        <EmptyState art="takip" title="Henüz paylaşılan takip yok" body="Doktorunuz kontrol veya tedavi günü kaydettiğinde burada görünür." />
      )}

      {onko.sonrakiKontrol && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Yaklaşan kontrol</Baslik>
          <div className="sg-goz-tarih">{uzunTarih(onko.sonrakiKontrol.tarih)}</div>
          <div className="sg-goz-meta">{onko.sonrakiKontrol.neden}</div>
        </SoftPanel>
      )}

      {onko.kurHatirlatma.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Tedavi / kür günleri</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {onko.kurHatirlatma.map((h, i) => (
              <li key={i}>{h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}</li>
            ))}
          </ul>
        </SoftPanel>
      )}

      {onko.labHatirlatma.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Kan tahlili kontrolleri</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {onko.labHatirlatma.map((h, i) => (
              <li key={i}>{h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}</li>
            ))}
          </ul>
          <div className="sg-goz-meta" style={{ marginTop: 8 }}>
            Sonuçları doktorunuz değerlendirir ve muayenede sizinle konuşur.
          </div>
        </SoftPanel>
      )}

      {onko.yanEtkiHatirlatma.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Yan etki kontrolleri</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {onko.yanEtkiHatirlatma.map((h, i) => (
              <li key={i}>{h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}</li>
            ))}
          </ul>
        </SoftPanel>
      )}

      {onko.hatirlatmalar.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Tüm hatırlatmalar</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {onko.hatirlatmalar.map((h, i) => (
              <li key={i}>
                {h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}
                {h.durum === 'gecikti' && <span className="sg-goz-meta"> · tarihi geçti</span>}
                {h.durum === 'yaklasiyor' && <span className="sg-goz-meta"> · yaklaşıyor</span>}
              </li>
            ))}
          </ul>
        </SoftPanel>
      )}

      {onko.ipuclari.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Genel öneriler</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {onko.ipuclari.map((x, i) => <li key={i}>{x}</li>)}
          </ul>
        </SoftPanel>
      )}

      <p className="sg-goz-meta" style={{ margin: '8px 20px 24px' }}>{onko.not}</p>
    </div>
  )
}
