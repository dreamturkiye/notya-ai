'use client'
/**
 * KALP-DAMAR-CERRAHISI-EXCEPTIONAL-01 — Sağlığım › Damar Cerrahisi takibi (hasta yüzü).
 * YASAK: tanı, SCORE2, Kalbim, ilaç dozu, INR hedef.
 */
import Link from 'next/link'
import type { PortalDamarCerrahisi } from '@/lib/portal/types'
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

const ALT_BASLIK = 'Doktorunuzun belirlediği kontrol, greft/yara ve ilaç izlem tarihleri. Yorum ve plan doktorunuzdadır.'

export function DamarCerrahisiTakibiView({ damar, basePath }: { damar: PortalDamarCerrahisi | null; basePath: string }) {
  if (!damar) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Damar Cerrahisi takibi" subtitle={ALT_BASLIK} />
        <EmptyState art="takip" title="Henüz paylaşılan takip yok" body="Doktorunuz kontrol veya greft/yara tarihi kaydettiğinde burada görünür." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Özet</Link>
      </div>
    )
  }

  const bos = !damar.sonrakiKontrol && !damar.hatirlatmalar.length && !damar.greftYaraHatirlatma.length && !damar.antikoagHatirlatma.length && !damar.preopHatirlatma.length

  return (
    <div className="sg-fade">
      <SectionHeader title="Damar Cerrahisi takibi" subtitle={ALT_BASLIK} />
      <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px 16px' }}>← Özet</Link>

      {bos && (
        <EmptyState art="takip" title="Henüz paylaşılan takip yok" body="Doktorunuz kontrol veya greft/yara tarihi kaydettiğinde burada görünür." />
      )}

      {damar.sonrakiKontrol && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Yaklaşan kontrol</Baslik>
          <div className="sg-goz-tarih">{uzunTarih(damar.sonrakiKontrol.tarih)}</div>
          <div className="sg-goz-meta">{damar.sonrakiKontrol.neden}</div>
        </SoftPanel>
      )}

      {damar.preopHatirlatma.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Ameliyat öncesi hazırlık</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {damar.preopHatirlatma.map((h, i) => (
              <li key={i}>{h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}</li>
            ))}
          </ul>
        </SoftPanel>
      )}

      {damar.greftYaraHatirlatma.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Greft / yara kontrolleri</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {damar.greftYaraHatirlatma.map((h, i) => (
              <li key={i}>{h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}</li>
            ))}
          </ul>
        </SoftPanel>
      )}

      {damar.antikoagHatirlatma.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>İlaç izlem / lab vadesi</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {damar.antikoagHatirlatma.map((h, i) => (
              <li key={i}>{h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}</li>
            ))}
          </ul>
          <div className="sg-goz-meta" style={{ marginTop: 8 }}>
            İlaç miktarını doktorunuz belirler; bu sayfada doz yazılmaz.
          </div>
        </SoftPanel>
      )}

      {damar.hatirlatmalar.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Diğer hatırlatmalar</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {damar.hatirlatmalar.map((h, i) => (
              <li key={i}>{h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}{h.durum === 'gecikti' ? ' (tarihi geçti)' : ''}</li>
            ))}
          </ul>
        </SoftPanel>
      )}

      {damar.ipuclari.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Hatırlatmalar</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {damar.ipuclari.map((x, i) => <li key={i}>{x}</li>)}
          </ul>
        </SoftPanel>
      )}

      <p className="sg-goz-meta" style={{ margin: '12px 20px 24px', fontSize: 12 }}>{damar.not}</p>
    </div>
  )
}
