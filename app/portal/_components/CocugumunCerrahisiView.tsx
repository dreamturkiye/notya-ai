'use client'
/**
 * COCUK-CERRAHISI-EXCEPTIONAL-01 — Sağlığım › Çocuğumun Cerrahisi.
 * YASAK: tanı, skor, doz, Neyzi, Hedef Boy.
 */
import Link from 'next/link'
import type { PortalCc } from '@/lib/portal/types'
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

export function CocugumunCerrahisiView({ cc, basePath }: { cc: PortalCc | null; basePath: string }) {
  if (!cc) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Çocuğumun Cerrahisi" subtitle={ALT_BASLIK} />
        <EmptyState art="takip" title="Henüz paylaşılan takip yok" body="Doktorunuz kontrol tarihi veya hatırlatma kaydettiğinde burada görünür." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Özet</Link>
      </div>
    )
  }

  const bos = !cc.sonrakiKontrol && !cc.hatirlatmalar.length && !cc.yaraHatirlatma.length && !cc.islemHatirlatma.length

  return (
    <div className="sg-fade">
      <SectionHeader title="Çocuğumun Cerrahisi" subtitle={ALT_BASLIK} />
      <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px 16px' }}>← Özet</Link>

      {bos && (
        <EmptyState art="takip" title="Henüz paylaşılan takip yok" body="Doktorunuz kontrol tarihi veya hatırlatma kaydettiğinde burada görünür." />
      )}

      {cc.sonrakiKontrol && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Yaklaşan kontrol</Baslik>
          <div className="sg-goz-tarih">{uzunTarih(cc.sonrakiKontrol.tarih)}</div>
          <div className="sg-goz-meta">{cc.sonrakiKontrol.neden}</div>
        </SoftPanel>
      )}

      {cc.yaraHatirlatma.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Yara / pansuman takip</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {cc.yaraHatirlatma.map((h, i) => (
              <li key={i}>{h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}</li>
            ))}
          </ul>
        </SoftPanel>
      )}

      {cc.islemHatirlatma.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>İşlem ve evrak hatırlatmaları</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {cc.islemHatirlatma.map((h, i) => (
              <li key={i}>{h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}</li>
            ))}
          </ul>
        </SoftPanel>
      )}

      {cc.hatirlatmalar.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Tüm hatırlatmalar</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {cc.hatirlatmalar.map((h, i) => (
              <li key={i}>
                {h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}
                {h.durum === 'gecikti' && <span className="sg-goz-meta"> · tarihi geçti</span>}
                {h.durum === 'yaklasiyor' && <span className="sg-goz-meta"> · yaklaşıyor</span>}
              </li>
            ))}
          </ul>
        </SoftPanel>
      )}

      {cc.bakimIpuclari.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Genel öneriler</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {cc.bakimIpuclari.map((x, i) => <li key={i}>{x}</li>)}
          </ul>
        </SoftPanel>
      )}

      <p className="sg-goz-meta" style={{ margin: '16px 20px' }}>{cc.not}</p>
    </div>
  )
}
