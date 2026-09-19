'use client'
/**
 * GENEL-CERRAHI-EXCEPTIONAL-01 — Sağlığım › Ameliyatım (hasta yüzü).
 * YASAK: tanı, patoloji sonucu, doz, OR slot.
 */
import Link from 'next/link'
import type { PortalGc } from '@/lib/portal/types'
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

export function AmeliyatimView({ gc, basePath }: { gc: PortalGc | null; basePath: string }) {
  if (!gc) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Ameliyatım" subtitle={ALT_BASLIK} />
        <EmptyState art="takip" title="Henüz paylaşılan takip yok" body="Doktorunuz kontrol tarihi veya hatırlatma kaydettiğinde burada görünür." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Özet</Link>
      </div>
    )
  }

  const bos = !gc.sonrakiKontrol && !gc.hatirlatmalar.length && !gc.ameliyatHatirlatma.length && !gc.yaraHatirlatma.length && !gc.raporHatirlatma.length

  return (
    <div className="sg-fade">
      <SectionHeader title="Ameliyatım" subtitle={ALT_BASLIK} />
      <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px 16px' }}>← Özet</Link>

      {bos && (
        <EmptyState art="takip" title="Henüz paylaşılan takip yok" body="Doktorunuz kontrol tarihi veya hatırlatma kaydettiğinde burada görünür." />
      )}

      {gc.sonrakiKontrol && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Yaklaşan kontrol</Baslik>
          <div className="sg-goz-tarih">{uzunTarih(gc.sonrakiKontrol.tarih)}</div>
          <div className="sg-goz-meta">{gc.sonrakiKontrol.neden}</div>
        </SoftPanel>
      )}

      {gc.ameliyatHatirlatma.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Ameliyat / işlem</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {gc.ameliyatHatirlatma.map((h, i) => (
              <li key={i}>{h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}</li>
            ))}
          </ul>
        </SoftPanel>
      )}

      {gc.yaraHatirlatma.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Yara / dren takip</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {gc.yaraHatirlatma.map((h, i) => (
              <li key={i}>{h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}</li>
            ))}
          </ul>
          <div className="sg-goz-meta" style={{ marginTop: 8 }}>
            Sonuçları doktorunuz değerlendirir ve muayenede sizinle konuşur.
          </div>
        </SoftPanel>
      )}

      {gc.raporHatirlatma.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Rapor ve görüntüleme</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {gc.raporHatirlatma.map((h, i) => (
              <li key={i}>{h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}</li>
            ))}
          </ul>
        </SoftPanel>
      )}

      {gc.hatirlatmalar.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Diğer hatırlatmalar</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {gc.hatirlatmalar.map((h, i) => (
              <li key={i}>{h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}</li>
            ))}
          </ul>
        </SoftPanel>
      )}

      {gc.ipuclari.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Bakım ipuçları</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {gc.ipuclari.map((x, i) => <li key={i}>{x}</li>)}
          </ul>
        </SoftPanel>
      )}

      <p className="sg-goz-meta" style={{ margin: '12px 20px 24px' }}>{gc.not}</p>
    </div>
  )
}
