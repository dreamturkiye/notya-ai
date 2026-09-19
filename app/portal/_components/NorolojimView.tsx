'use client'
/**
 * NOROLOJI-EXCEPTIONAL-01 — Sağlığım › Nörolojimm (hasta yüzü).
 * YASAK: tanı, MIDAS skoru/bandı, ilaç adı, doz, "inme/TIA" klinik etiketi.
 */
import Link from 'next/link'
import type { PortalNoro } from '@/lib/portal/types'
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

export function NorolojimView({ noro, basePath }: { noro: PortalNoro | null; basePath: string }) {
  if (!noro) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Nörolojimm" subtitle={ALT_BASLIK} />
        <EmptyState art="takip" title="Henüz paylaşılan takip yok" body="Doktorunuz kontrol tarihi veya hatırlatma kaydettiğinde burada görünür." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Özet</Link>
      </div>
    )
  }

  const bos = !noro.sonrakiKontrol && !noro.hatirlatmalar.length && !noro.formHatirlatma.length && !noro.ilacHatirlatma.length

  return (
    <div className="sg-fade">
      <SectionHeader title="Nörolojimm" subtitle={ALT_BASLIK} />
      <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px 16px' }}>← Özet</Link>

      {bos && (
        <EmptyState art="takip" title="Henüz paylaşılan takip yok" body="Doktorunuz kontrol tarihi veya hatırlatma kaydettiğinde burada görünür." />
      )}

      {noro.sonrakiKontrol && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Yaklaşan kontrol</Baslik>
          <div className="sg-goz-tarih">{uzunTarih(noro.sonrakiKontrol.tarih)}</div>
          <div className="sg-goz-meta">{noro.sonrakiKontrol.neden}</div>
        </SoftPanel>
      )}

      {noro.formHatirlatma.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Doldurmanız istenen formlar</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {noro.formHatirlatma.map((h, i) => (
              <li key={i}>{h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}</li>
            ))}
          </ul>
          <div className="sg-goz-meta" style={{ marginTop: 8 }}>
            Form sonucunu doktorunuz değerlendirir ve muayenede sizinle konuşur.
          </div>
        </SoftPanel>
      )}

      {noro.ilacHatirlatma.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>İlaç güvenlik kontrolleri</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {noro.ilacHatirlatma.map((h, i) => (
              <li key={i}>{h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}</li>
            ))}
          </ul>
        </SoftPanel>
      )}

      {noro.hatirlatmalar.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Tüm hatırlatmalar</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {noro.hatirlatmalar.map((h, i) => (
              <li key={i}>
                {h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}
                {h.durum === 'gecikti' && <span className="sg-goz-meta"> · tarihi geçti</span>}
                {h.durum === 'yaklasiyor' && <span className="sg-goz-meta"> · yaklaşıyor</span>}
              </li>
            ))}
          </ul>
        </SoftPanel>
      )}

      {noro.ipuclari.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Genel öneriler</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {noro.ipuclari.map((x, i) => <li key={i}>{x}</li>)}
          </ul>
        </SoftPanel>
      )}

      <div className="sg-goz-meta" style={{ margin: '12px 20px 24px' }}>{noro.not}</div>
    </div>
  )
}
