'use client'
/**
 * DAH-EXCEPTIONAL-01 — Sağlığım › Takibim (hasta yüzü).
 * Hekim hedefleri, hatırlatmalar, ev ölçüm özeti. Tanı / doz / skor yok.
 */
import Link from 'next/link'
import type { PortalKronik } from '@/lib/portal/types'
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

export function TakibimView({ kronik, basePath }: { kronik: PortalKronik | null; basePath: string }) {
  if (!kronik) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Takibim" subtitle="Hedefler, hatırlatmalar ve ev ölçüm özetiniz." />
        <EmptyState art="takip" title="Henüz paylaşılan takip yok" body="Doktorunuz hedef veya kontrol kaydettiğinde burada görünür." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Özet</Link>
      </div>
    )
  }

  const bos =
    !kronik.sonrakiKontrol &&
    !kronik.hatirlatmalar.length &&
    !kronik.hedefler.length &&
    !kronik.evKbOzet &&
    !kronik.evGlukozOzet

  return (
    <div className="sg-fade">
      <SectionHeader
        title="Takibim"
        subtitle="Doktorunuzun belirlediği hedefler, hatırlatmalar ve ev ölçüm özeti. Yorum ve plan doktorunuzdadır."
      />
      <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px 16px' }}>← Özet</Link>

      {bos && (
        <EmptyState art="takip" title="Henüz paylaşılan takip yok" body="Doktorunuz kontrol veya hedef kaydettiğinde burada görünür. Ön anket ile ev ölçülerinizi de iletebilirsiniz." />
      )}

      {kronik.sonrakiKontrol && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Yaklaşan kontrol</Baslik>
          <div className="sg-goz-tarih">{uzunTarih(kronik.sonrakiKontrol.tarih)}</div>
          <div className="sg-goz-meta">{kronik.sonrakiKontrol.neden}</div>
        </SoftPanel>
      )}

      {kronik.hedefler.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Hedefleriniz</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {kronik.hedefler.map((h, i) => (
              <li key={i}>
                <strong>{h.ad}</strong>
                {h.ozet ? ` — ${h.ozet}` : ''}
              </li>
            ))}
          </ul>
        </SoftPanel>
      )}

      {(kronik.evKbOzet || kronik.evGlukozOzet) && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Ev ölçümleri</Baslik>
          {kronik.evKbOzet && <div className="sg-goz-meta" style={{ marginBottom: 6 }}>Kan basıncı: {kronik.evKbOzet}</div>}
          {kronik.evGlukozOzet && <div className="sg-goz-meta">Şeker: {kronik.evGlukozOzet}</div>}
          <div className="sg-goz-meta" style={{ marginTop: 8 }}>
            Yeni ölçüm için Ön anket bölümünü kullanabilirsiniz.
          </div>
        </SoftPanel>
      )}

      {kronik.hatirlatmalar.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Hatırlatmalar</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {kronik.hatirlatmalar.map((h, i) => (
              <li key={i}>
                {h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}
                {h.durum === 'gecikti' && <span className="sg-goz-meta"> · tarihi geçti</span>}
                {h.durum === 'yaklasiyor' && <span className="sg-goz-meta"> · yaklaşıyor</span>}
              </li>
            ))}
          </ul>
          <div className="sg-goz-meta" style={{ marginTop: 8 }}>
            Tarihleri muayenehaneniz belirler. Değiştirmek için mesaj gönderin veya arayın.
          </div>
        </SoftPanel>
      )}

      <div className="sg-goz-meta" style={{ margin: '12px 20px 24px' }}>{kronik.not}</div>
    </div>
  )
}
