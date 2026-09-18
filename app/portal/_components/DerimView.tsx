'use client'
/**
 * DERM-PORTAL — Sağlığım › Derim (hasta yüzü).
 * Foto yüklendi, kontrol/lab hatırlatma, fototerapi seans tarihi, işlem kaydı.
 * Hasta yüzünde lezyon tarif / skor / doz yok (.cursor/skills/specialty-hasta-portali — Dermatoloji).
 */
import Link from 'next/link'
import type { PortalDeri } from '@/lib/portal/types'
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

export function DerimView({ deri, basePath }: { deri: PortalDeri | null; basePath: string }) {
  if (!deri) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Derim" subtitle="Kontrol tarihleri, fotoğraf bildirimleri ve tedavi hatırlatmaları." />
        <EmptyState art="takip" title="Henüz paylaşılan deri takibi yok" body="Doktorunuz kayıt paylaştığında burada görünür." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Özet</Link>
      </div>
    )
  }

  const bos =
    !deri.sonrakiKontrol &&
    !deri.hatirlatmalar.length &&
    !deri.fotograflar.length &&
    !deri.islemler.length &&
    !deri.fototerapi.length &&
    !deri.labHatirlatma.length

  return (
    <div className="sg-fade">
      <SectionHeader
        title="Derim"
        subtitle="Kontrol tarihleri, fotoğraf bildirimleri ve tedavi hatırlatmaları. Yorum ve tanı doktorunuzdadır."
      />
      <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px 16px' }}>← Özet</Link>

      {bos && (
        <EmptyState art="takip" title="Henüz paylaşılan deri takibi yok" body="Doktorunuz kontrol veya fotoğraf kaydettiğinde burada görünür." />
      )}

      {deri.sonrakiKontrol && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Yaklaşan kontrol</Baslik>
          <div className="sg-goz-tarih">{uzunTarih(deri.sonrakiKontrol.tarih)}</div>
          <div className="sg-goz-meta">{deri.sonrakiKontrol.neden}</div>
        </SoftPanel>
      )}

      {deri.labHatirlatma.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Lab / güvenlik kontrolü</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {deri.labHatirlatma.map((l, i) => (
              <li key={i}>{l.ad}{l.due ? ` · ${uzunTarih(l.due)}` : ''}</li>
            ))}
          </ul>
        </SoftPanel>
      )}

      {deri.hatirlatmalar.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Hatırlatmalar</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {deri.hatirlatmalar.map((h, i) => (
              <li key={i}>
                {h.ad}{h.due ? ` · ${uzunTarih(h.due)}` : ''}
                {h.durum === 'gecikti' && <span className="sg-goz-meta"> · tarihi geçti</span>}
                {h.durum === 'yaklasiyor' && <span className="sg-goz-meta"> · yaklaşıyor</span>}
              </li>
            ))}
          </ul>
          <div className="sg-goz-meta" style={{ marginTop: 8 }}>
            Tarihleri muayenehaneniz belirler. Değiştirmek için mesaj gönderin veya muayenehaneyi arayın.
          </div>
        </SoftPanel>
      )}

      {deri.fotograflar.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Yüklenen fotoğraflar</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {deri.fotograflar.map((f) => (
              <li key={f.id}>{f.tur} · {uzunTarih(f.tarih.slice(0, 10))}</li>
            ))}
          </ul>
          <div className="sg-goz-meta" style={{ marginTop: 8 }}>
            Fotoğraflar muayenehanede saklanır; burası yalnızca &quot;yüklendi&quot; bildirimi.
          </div>
        </SoftPanel>
      )}

      {deri.fototerapi.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Fototerapi seansları</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {deri.fototerapi.map((s, i) => (
              <li key={i}>{uzunTarih(s.tarih)}{s.cihaz ? ` · ${s.cihaz}` : ''}</li>
            ))}
          </ul>
        </SoftPanel>
      )}

      {deri.islemler.length > 0 && (
        <SoftPanel className="sg-goz-panel">
          <Baslik>Klinik işlemler</Baslik>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {deri.islemler.map((i, idx) => (
              <li key={idx}>{i.ad} · {uzunTarih(i.tarih)}</li>
            ))}
          </ul>
        </SoftPanel>
      )}

      <p style={{ margin: '16px 20px', fontSize: 13, color: 'var(--sg-muted)' }}>{deri.not}</p>
      <p style={{ margin: '0 20px 24px', fontSize: 13, color: 'var(--sg-muted)' }}>
        Ani yaygın döküntü, nefes darlığı veya yara enfeksiyonu şüphesinde 112 / acil — portal mesajı acil değildir.
      </p>
    </div>
  )
}
