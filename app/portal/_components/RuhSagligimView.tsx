'use client'
/**
 * PSIK-EXCEPTIONAL-01 — Sağlığım › Ruh Sağlığım (hasta yüzü).
 * Yalnız hekimin belirlediği tarihler ve sabit, hasta-güvenli başlıklar.
 * YASAK: tanı adı, ölçek adı (PHQ-9 / GAD-7 / CGI), skor, şiddet bandı, ilaç / etken madde, doz.
 * Başlıklar specialties/psikiyatri/engines/portal-ruhsagligim.ts içinde koddan üretilir; bu bileşen metin uydurmaz.
 */
import Link from 'next/link'
import type { PortalPsik } from '@/lib/portal/types'
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

export function RuhSagligimView({ psik, basePath }: { psik: PortalPsik | null; basePath: string }) {
  if (!psik) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Ruh Sağlığım" subtitle={ALT_BASLIK} />
        <EmptyState art="takip" title="Henüz paylaşılan takip yok" body="Doktorunuz kontrol tarihi veya hatırlatma kaydettiğinde burada görünür." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Özet</Link>
      </div>
    )
  }

  const bos = !psik.sonrakiKontrol && !psik.hatirlatmalar.length && !psik.olcekHatirlatma.length && !psik.ilacHatirlatma.length

  return (
    <div className="sg-fade">
      <SectionHeader title="Ruh Sağlığım" subtitle={ALT_BASLIK} />
      <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px 16px' }}>← Özet</Link>

      {bos && (
        <EmptyState art="takip" title="Henüz paylaşılan takip yok" body="Doktorunuz kontrol tarihi veya hatırlatma kaydettiğinde burada görünür." />
      )}

      {psik.sonrakiKontrol && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Yaklaşan kontrol</Baslik>
          <div className="sg-goz-tarih">{uzunTarih(psik.sonrakiKontrol.tarih)}</div>
          <div className="sg-goz-meta">{psik.sonrakiKontrol.neden}</div>
        </SoftPanel>
      )}

      {psik.olcekHatirlatma.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Doldurmanız istenen formlar</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {psik.olcekHatirlatma.map((h, i) => (
              <li key={i}>{h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}</li>
            ))}
          </ul>
          <div className="sg-goz-meta" style={{ marginTop: 8 }}>
            Formu muayenehanede doldurursunuz; sonucu doktorunuz değerlendirir.
          </div>
        </SoftPanel>
      )}

      {psik.ilacHatirlatma.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Kontrol ve tetkik hatırlatmaları</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {psik.ilacHatirlatma.map((h, i) => (
              <li key={i}>{h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}</li>
            ))}
          </ul>
          <div className="sg-goz-meta" style={{ marginTop: 8 }}>
            Tetkik öncesi aç kalmanız gerekip gerekmediğini muayenehanenize sorabilirsiniz.
          </div>
        </SoftPanel>
      )}

      {psik.hatirlatmalar.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Tüm hatırlatmalar</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {psik.hatirlatmalar.map((h, i) => (
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

      <div className="sg-goz-meta" style={{ margin: '12px 20px 24px' }}>{psik.not}</div>
    </div>
  )
}
