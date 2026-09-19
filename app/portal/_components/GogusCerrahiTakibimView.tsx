'use client'
/**
 * GOGUS-CERRAHISI-EXCEPTIONAL-01 — Sağlığım › Göğüs Cerrahisi takibi (hasta yüzü).
 * YASAK: tanı, CAT/mMRC, GOLD, inhaler doz, ilaç dozu, "kanser/tümör".
 */
import Link from 'next/link'
import type { PortalGogusCerrahi } from '@/lib/portal/types'
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

const ALT_BASLIK = 'Doktorunuzun belirlediği kontrol, tüp/yara ve patoloji rapor tarihleri. Yorum ve plan doktorunuzdadır.'

export function GogusCerrahiTakibimView({ gc, basePath }: { gc: PortalGogusCerrahi | null; basePath: string }) {
  if (!gc) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Göğüs Cerrahisi takibi" subtitle={ALT_BASLIK} />
        <EmptyState art="takip" title="Henüz paylaşılan takip yok" body="Doktorunuz kontrol veya tüp/yara tarihi kaydettiğinde burada görünür." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Özet</Link>
      </div>
    )
  }

  const bos = !gc.sonrakiKontrol && !gc.hatirlatmalar.length && !gc.tupYaraHatirlatma.length && !gc.patolojiHatirlatma.length && !gc.preopHatirlatma.length

  return (
    <div className="sg-fade">
      <SectionHeader title="Göğüs Cerrahisi takibi" subtitle={ALT_BASLIK} />
      <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px 16px' }}>← Özet</Link>

      {bos && (
        <EmptyState art="takip" title="Henüz paylaşılan takip yok" body="Doktorunuz kontrol veya tüp/yara tarihi kaydettiğinde burada görünür." />
      )}

      {gc.sonrakiKontrol && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Yaklaşan kontrol</Baslik>
          <div className="sg-goz-tarih">{uzunTarih(gc.sonrakiKontrol.tarih)}</div>
          <div className="sg-goz-meta">{gc.sonrakiKontrol.neden}</div>
        </SoftPanel>
      )}

      {gc.preopHatirlatma.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Ameliyat öncesi hazırlık</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {gc.preopHatirlatma.map((h, i) => (
              <li key={i}>{h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}</li>
            ))}
          </ul>
        </SoftPanel>
      )}

      {gc.tupYaraHatirlatma.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Tüp / yara kontrolleri</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {gc.tupYaraHatirlatma.map((h, i) => (
              <li key={i}>{h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}</li>
            ))}
          </ul>
        </SoftPanel>
      )}

      {gc.patolojiHatirlatma.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Patoloji raporu</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {gc.patolojiHatirlatma.map((h, i) => (
              <li key={i}>{h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}</li>
            ))}
          </ul>
          <div className="sg-goz-meta" style={{ marginTop: 8 }}>
            Sonucu doktorunuz değerlendirir ve muayenede sizinle konuşur.
          </div>
        </SoftPanel>
      )}

      {gc.hatirlatmalar.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Diğer hatırlatmalar</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {gc.hatirlatmalar.map((h, i) => (
              <li key={i}>{h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}{h.durum === 'gecikti' ? ' (tarihi geçti)' : ''}</li>
            ))}
          </ul>
        </SoftPanel>
      )}

      {gc.ipuclari.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Hatırlatmalar</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {gc.ipuclari.map((x, i) => <li key={i}>{x}</li>)}
          </ul>
        </SoftPanel>
      )}

      <p className="sg-goz-meta" style={{ margin: '12px 20px 24px', fontSize: 12 }}>{gc.not}</p>
    </div>
  )
}
