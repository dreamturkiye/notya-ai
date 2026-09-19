'use client'
/**
 * KBB-EXCEPTIONAL-01 — Sağlığım › Kulaklarım (hasta yüzü).
 * Yalnız hekimin belirlediği tarihler ve sabit, hasta-güvenli başlıklar.
 * YASAK: tanı adı, dB / PTA değeri, işitme kaybı bandı veya tipi, ilaç / etken madde, doz.
 * Başlıklar specialties/kulak-burun-bogaz/engines/portal-kulaklarim.ts içinde koddan üretilir;
 * bu bileşen metin uydurmaz.
 */
import Link from 'next/link'
import type { PortalKulak } from '@/lib/portal/types'
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

export function KulaklarimView({ kulak, basePath }: { kulak: PortalKulak | null; basePath: string }) {
  if (!kulak) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Kulaklarım" subtitle={ALT_BASLIK} />
        <EmptyState art="takip" title="Henüz paylaşılan takip yok" body="Doktorunuz kontrol tarihi veya hatırlatma kaydettiğinde burada görünür." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Özet</Link>
      </div>
    )
  }

  const bos = !kulak.sonrakiKontrol && !kulak.hatirlatmalar.length && !kulak.testHatirlatma.length && !kulak.islemHatirlatma.length

  return (
    <div className="sg-fade">
      <SectionHeader title="Kulaklarım" subtitle={ALT_BASLIK} />
      <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px 16px' }}>← Özet</Link>

      {bos && (
        <EmptyState art="takip" title="Henüz paylaşılan takip yok" body="Doktorunuz kontrol tarihi veya hatırlatma kaydettiğinde burada görünür." />
      )}

      {kulak.sonrakiKontrol && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Yaklaşan kontrol</Baslik>
          <div className="sg-goz-tarih">{uzunTarih(kulak.sonrakiKontrol.tarih)}</div>
          <div className="sg-goz-meta">{kulak.sonrakiKontrol.neden}</div>
        </SoftPanel>
      )}

      {kulak.testHatirlatma.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Planlanan testler</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {kulak.testHatirlatma.map((h, i) => (
              <li key={i}>{h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}</li>
            ))}
          </ul>
          <div className="sg-goz-meta" style={{ marginTop: 8 }}>
            Test sonucunu doktorunuz değerlendirir ve muayenede sizinle konuşur.
          </div>
        </SoftPanel>
      )}

      {kulak.islemHatirlatma.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>İşlem ve bakım randevuları</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {kulak.islemHatirlatma.map((h, i) => (
              <li key={i}>{h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}</li>
            ))}
          </ul>
        </SoftPanel>
      )}

      {kulak.hatirlatmalar.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Tüm hatırlatmalar</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {kulak.hatirlatmalar.map((h, i) => (
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

      {kulak.bakimIpuclari.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Kulak bakımı</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {kulak.bakimIpuclari.map((x, i) => <li key={i}>{x}</li>)}
          </ul>
        </SoftPanel>
      )}

      <div className="sg-goz-meta" style={{ margin: '12px 20px 24px' }}>{kulak.not}</div>
    </div>
  )
}
