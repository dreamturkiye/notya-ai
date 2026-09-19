'use client'
/**
 * PLASTIK-CERRAHI-EXCEPTIONAL-01 — Sağlığım › Yaram (hasta yüzü).
 * YASAK: tanı, skor (PASI…), doz, keloit/melanom dili.
 */
import Link from 'next/link'
import type { PortalPlastik } from '@/lib/portal/types'
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

const ALT_BASLIK = 'Doktorunuzun belirlediği pansuman, dikiş ve kontrol tarihleri. Yorum ve plan doktorunuzdadır.'

export function YaramView({ plastik, basePath }: { plastik: PortalPlastik | null; basePath: string }) {
  if (!plastik) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Yaram" subtitle={ALT_BASLIK} />
        <EmptyState art="takip" title="Henüz paylaşılan takip yok" body="Doktorunuz pansuman veya kontrol kaydettiğinde burada görünür." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Özet</Link>
      </div>
    )
  }

  const bos = !plastik.sonrakiKontrol && !plastik.hatirlatmalar.length && !plastik.pansumanHatirlatma.length && !plastik.fotoHatirlatma.length && !plastik.dikisHatirlatma.length

  return (
    <div className="sg-fade">
      <SectionHeader title="Yaram" subtitle={ALT_BASLIK} />
      <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px 16px' }}>← Özet</Link>

      {bos && (
        <EmptyState art="takip" title="Henüz paylaşılan takip yok" body="Doktorunuz pansuman veya kontrol kaydettiğinde burada görünür." />
      )}

      {plastik.sonrakiKontrol && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Yaklaşan kontrol</Baslik>
          <div className="sg-goz-tarih">{uzunTarih(plastik.sonrakiKontrol.tarih)}</div>
          <div className="sg-goz-meta">{plastik.sonrakiKontrol.neden}</div>
        </SoftPanel>
      )}

      {plastik.pansumanHatirlatma.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Pansuman / yara bakımı</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {plastik.pansumanHatirlatma.map((h, i) => (
              <li key={i}>{h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}</li>
            ))}
          </ul>
        </SoftPanel>
      )}

      {plastik.dikisHatirlatma.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Dikiş alma</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {plastik.dikisHatirlatma.map((h, i) => (
              <li key={i}>{h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}</li>
            ))}
          </ul>
        </SoftPanel>
      )}

      {plastik.fotoHatirlatma.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Foto / izlem kontrolü</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {plastik.fotoHatirlatma.map((h, i) => (
              <li key={i}>{h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}</li>
            ))}
          </ul>
          <div className="sg-goz-meta" style={{ marginTop: 8 }}>
            Fotoğraflarınızı doktorunuz değerlendirir; yorum portalda yapılmaz.
          </div>
        </SoftPanel>
      )}

      {plastik.hatirlatmalar.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Diğer hatırlatmalar</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {plastik.hatirlatmalar.map((h, i) => (
              <li key={i}>{h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}{h.durum === 'gecikti' ? ' (gecikti)' : ''}</li>
            ))}
          </ul>
        </SoftPanel>
      )}

      {plastik.ipuclari.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Hatırlatmalar</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {plastik.ipuclari.map((x, i) => <li key={i}>{x}</li>)}
          </ul>
        </SoftPanel>
      )}

      <p className="sg-goz-meta" style={{ margin: '12px 20px 24px' }}>{plastik.not}</p>
    </div>
  )
}
