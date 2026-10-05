'use client'
/**
 * KONSULTASYONLAR-01 — İstem alt sekmesi.
 * Tam istem formu hasta dosyası › Konsültasyonlar'dan açılır; burada defterden hızlı yol + açıklama.
 */
import React, { useEffect, useState } from 'react'
import { useAracStil } from '@/lib/doktor/aracUi'
import { CHROME_FONT, CHROME_RENK } from '@/lib/doktor/chromeTheme'
import { konsultasyonApi } from '@/lib/doktor/konsultasyonIstemci'

type Kayit = {
  id: string
  adSoyad: string
  brans: string
  eposta: string | null
  ofisTelefon?: string | null
  telefon?: string | null
  not?: string | null
}

export default function KonsultasyonIstemSekmesi() {
  const stil = useAracStil()
  const [defter, setDefter] = useState<Kayit[]>([])

  useEffect(() => {
    konsultasyonApi('/api/doktor/konsultasyon/defter').then(({ ok, j }) => {
      if (ok && Array.isArray(j.defter)) setDefter(j.defter)
    }).catch(() => {})
  }, [])

  return (
    <div data-konsultasyon-istem-sekme="">
      <div style={{ ...stil.kutu, marginBottom: 14 }}>
        <div style={{ fontFamily: CHROME_FONT.serif, fontSize: 18, fontWeight: 560, color: CHROME_RENK.ink, marginBottom: 8 }}>
          Muayeneden istem
        </div>
        <p style={{ ...stil.metin, color: CHROME_RENK.muted, margin: 0 }}>
          Konsültasyon istemi hasta dosyasından açılır. Dilimde kısa özgeçmiş, klinik soru ve onaylı not cümleleri gider —
          fısıltı, ham transkript ve model adı gitmez. Defterden konsültan + e-posta seçin (veya yazın); portal linki
          sizin bağlı Gmail/Outlook kutunuzdan gider. Kutunuz yoksa Ayarlar › İletişim’den bağlayın; sonra karttaki
          «E-posta gönder» ile iletebilirsiniz.
        </p>
        <a
          href="/dashboard/doktor/hastalar"
          style={{ ...stil.btn, display: 'inline-flex', marginTop: 14, textDecoration: 'none' }}
        >
          Hasta seç · istem aç
        </a>
      </div>

      <div style={{ ...stil.kucuk, marginBottom: 10 }}>Defterinizdeki konsültanlar ({defter.length})</div>
      {!defter.length ? (
        <div style={{ ...stil.kutu, color: CHROME_RENK.muted, fontSize: 14 }}>
          Önce Defter sekmesinden bir konsültan ekleyin — örneğin KBB.
        </div>
      ) : (
        defter.map((k) => (
          <div key={k.id} style={{ ...stil.kutu, marginBottom: 8 }}>
            <strong style={{ color: CHROME_RENK.ink }}>{k.adSoyad}</strong>
            <span style={{ ...stil.kucuk, marginLeft: 8 }}>{k.brans}</span>
            <div style={{ ...stil.kucuk, marginTop: 4, lineHeight: 1.45 }}>
              {[k.ofisTelefon && `Ofis: ${k.ofisTelefon}`, k.telefon && `Cep: ${k.telefon}`, k.eposta].filter(Boolean).join(' · ')}
            </div>
            {k.not ? (
              <div style={{ ...stil.kucuk, marginTop: 6, whiteSpace: 'pre-wrap', color: CHROME_RENK.ink }}>{k.not}</div>
            ) : null}
          </div>
        ))
      )}
    </div>
  )
}
