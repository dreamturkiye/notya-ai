'use client'
/**
 * BEYIN-CERRAHISI-EXCEPTIONAL-01 — Sağlığım › Beyin Cerrahisi takibi (hasta yüzü).
 * YASAK: tanı, AED doz, migren/inme skoru, ameliyat tekniği.
 */
import Link from 'next/link'
import type { PortalBeyin } from '@/lib/portal/types'
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

const ALT_BASLIK = 'Doktorunuzun belirlediği kontrol ve takip tarihleri. Yorum ve plan doktorunuzdadır.'

export function BeyinTakibiView({ beyin, basePath }: { beyin: PortalBeyin | null; basePath: string }) {
  if (!beyin) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Beyin Cerrahisi takibi" subtitle={ALT_BASLIK} />
        <EmptyState art="takip" title="Henüz paylaşılan takip yok" body="Doktorunuz kontrol veya takip tarihi kaydettiğinde burada görünür." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Özet</Link>
      </div>
    )
  }

  const bos = !beyin.sonrakiKontrol && !beyin.hatirlatmalar.length && !beyin.postopHatirlatma.length && !beyin.goruntuHatirlatma.length && !beyin.izlemHatirlatma.length

  return (
    <div className="sg-fade">
      <SectionHeader title="Beyin Cerrahisi takibi" subtitle={ALT_BASLIK} />
      <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px 16px' }}>← Özet</Link>

      {bos && (
        <EmptyState art="takip" title="Henüz paylaşılan takip yok" body="Doktorunuz kontrol veya takip tarihi kaydettiğinde burada görünür." />
      )}

      {beyin.sonrakiKontrol && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Yaklaşan kontrol</Baslik>
          <div className="sg-goz-tarih">{uzunTarih(beyin.sonrakiKontrol.tarih)}</div>
          <div className="sg-goz-meta">{beyin.sonrakiKontrol.neden}</div>
        </SoftPanel>
      )}

      {beyin.postopHatirlatma.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Ameliyat sonrası kontroller</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {beyin.postopHatirlatma.map((h, i) => (
              <li key={i}>{h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}</li>
            ))}
          </ul>
        </SoftPanel>
      )}

      {beyin.goruntuHatirlatma.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Görüntü / belge kontrolleri</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {beyin.goruntuHatirlatma.map((h, i) => (
              <li key={i}>{h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}</li>
            ))}
          </ul>
          <div className="sg-goz-meta" style={{ marginTop: 8 }}>
            Sonuçları doktorunuz değerlendirir ve muayenede sizinle konuşur.
          </div>
        </SoftPanel>
      )}

      {beyin.izlemHatirlatma.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>İzlem kontrolleri</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {beyin.izlemHatirlatma.map((h, i) => (
              <li key={i}>{h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}</li>
            ))}
          </ul>
        </SoftPanel>
      )}

      {beyin.hatirlatmalar.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Tüm hatırlatmalar</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {beyin.hatirlatmalar.map((h, i) => (
              <li key={i}>
                {h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}
                {h.durum === 'gecikti' && <span className="sg-goz-meta"> · tarihi geçti</span>}
                {h.durum === 'yaklasiyor' && <span className="sg-goz-meta"> · yaklaşıyor</span>}
              </li>
            ))}
          </ul>
        </SoftPanel>
      )}

      {beyin.ipuclari.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Genel öneriler</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {beyin.ipuclari.map((x, i) => <li key={i}>{x}</li>)}
          </ul>
        </SoftPanel>
      )}

      <p className="sg-goz-meta" style={{ margin: '8px 20px 24px' }}>{beyin.not}</p>
    </div>
  )
}
