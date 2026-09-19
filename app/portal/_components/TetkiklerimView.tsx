'use client'
/**
 * RADYOLOJI-EXCEPTIONAL-01 — Sağlığım › Tetkiklerim (hasta yüzü).
 * YASAK: tanı, BI-RADS sayı, AI bulgu, yorum = tanı. Yalnız durum/tarih.
 */
import Link from 'next/link'
import type { PortalRadyo } from '@/lib/portal/types'
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

const ALT_BASLIK = 'Doktorunuzun belirlediği tetkik ve rapor tarihleri. Sonuç yorumu doktorunuzdadır.'

export function TetkiklerimView({ radyo, basePath }: { radyo: PortalRadyo | null; basePath: string }) {
  if (!radyo) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Tetkiklerim" subtitle={ALT_BASLIK} />
        <EmptyState art="takip" title="Henüz paylaşılan tetkik yok" body="Doktorunuz tetkik veya rapor tarihi kaydettiğinde burada görünür." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Özet</Link>
      </div>
    )
  }

  const bos = !radyo.sonrakiKontrol && !radyo.hatirlatmalar.length && !radyo.tetkikHatirlatma.length && !radyo.raporHatirlatma.length && !radyo.belgeHatirlatma.length && !radyo.tetkikler.length

  return (
    <div className="sg-fade">
      <SectionHeader title="Tetkiklerim" subtitle={ALT_BASLIK} />
      <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px 16px' }}>← Özet</Link>

      {bos && (
        <EmptyState art="takip" title="Henüz paylaşılan tetkik yok" body="Doktorunuz tetkik veya rapor tarihi kaydettiğinde burada görünür." />
      )}

      {radyo.sonrakiKontrol && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Yaklaşan kontrol</Baslik>
          <div className="sg-goz-tarih">{uzunTarih(radyo.sonrakiKontrol.tarih)}</div>
          <div className="sg-goz-meta">{radyo.sonrakiKontrol.neden}</div>
        </SoftPanel>
      )}

      {radyo.tetkikler.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Tetkik durumları</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {radyo.tetkikler.map((t, i) => (
              <li key={i}>
                {t.modaliteEtiket} · {t.durum}
                {t.tarih ? ` · ${uzunTarih(t.tarih)}` : ''}
              </li>
            ))}
          </ul>
          <div className="sg-goz-meta" style={{ marginTop: 8 }}>
            Sonuç yorumunu doktorunuz muayenede sizinle konuşur.
          </div>
        </SoftPanel>
      )}

      {radyo.tetkikHatirlatma.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Tetkik randevuları</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {radyo.tetkikHatirlatma.map((h, i) => (
              <li key={i}>{h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}</li>
            ))}
          </ul>
        </SoftPanel>
      )}

      {radyo.raporHatirlatma.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Rapor durumu</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {radyo.raporHatirlatma.map((h, i) => (
              <li key={i}>{h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}</li>
            ))}
          </ul>
        </SoftPanel>
      )}

      {radyo.belgeHatirlatma.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Görüntü / belge kontrolleri</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {radyo.belgeHatirlatma.map((h, i) => (
              <li key={i}>{h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}</li>
            ))}
          </ul>
        </SoftPanel>
      )}

      {radyo.hatirlatmalar.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Tüm hatırlatmalar</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {radyo.hatirlatmalar.map((h, i) => (
              <li key={i}>
                {h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}
                {h.durum === 'gecikti' && <span className="sg-goz-meta"> · tarihi geçti</span>}
                {h.durum === 'yaklasiyor' && <span className="sg-goz-meta"> · yaklaşıyor</span>}
              </li>
            ))}
          </ul>
        </SoftPanel>
      )}

      {radyo.ipuclari.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Genel öneriler</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {radyo.ipuclari.map((x, i) => <li key={i}>{x}</li>)}
          </ul>
        </SoftPanel>
      )}

      <p className="sg-goz-meta" style={{ margin: '8px 20px 24px' }}>{radyo.not}</p>
    </div>
  )
}
