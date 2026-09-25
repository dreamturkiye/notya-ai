'use client'
/**
 * NOTYA-ILETISIM-01 — appointment screen: "Hastaya mesaj" for one randevu. The doctor and the
 * secretary pick what to tell the patient (hatırlatma / saat değişti / tetkik getirin, or the
 * cancellation for a cancelled booking) and send it from this device's own WhatsApp / mail through
 * the one send button. Only appointment types — the same set the server allows a secretary.
 */
import React, { useState } from 'react'
import { CHROME_FONT, CHROME_RENK } from '@/lib/doktor/chromeTheme'
import type { MesajTuru } from '@/lib/iletisim/tipler'
import GonderDugmesi from './GonderDugmesi'

const SECENEKLER: Array<{ tur: MesajTuru; etiket: string }> = [
  { tur: 'randevu_hatirlatma', etiket: 'Hatırlatma' },
  { tur: 'randevu_degisikligi', etiket: 'Saat değişti' },
  { tur: 'tetkik_getirin', etiket: 'Tetkiklerini getirsin' },
]

export default function RandevuMesaji({ randevuId, patientId, iptal }: { randevuId: string; patientId: string | null; iptal?: boolean }) {
  const [tur, setTur] = useState<MesajTuru | null>(null)
  if (!patientId) {
    return (
      <div style={{ fontSize: 12.5, color: CHROME_RENK.muted, marginTop: 10, fontFamily: CHROME_FONT.sans }}>
        Hastaya mesaj göndermek için randevuyu bir hasta kaydına bağlayın.
      </div>
    )
  }
  const secenekler = iptal ? [{ tur: 'randevu_iptali' as MesajTuru, etiket: 'İptali bildir' }] : SECENEKLER
  return (
    <div style={{ marginTop: 12, fontFamily: CHROME_FONT.sans }}>
      <div style={{ fontSize: 12.5, color: CHROME_RENK.muted, marginBottom: 6 }}>Hastaya mesaj</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: tur ? 10 : 0 }}>
        {secenekler.map((s) => {
          const secili = tur === s.tur
          return (
            <button
              key={s.tur}
              type="button"
              aria-pressed={secili}
              onClick={() => setTur(secili ? null : s.tur)}
              style={{
                minHeight: 36, padding: '0 14px', borderRadius: 999, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                border: `1px solid ${secili ? CHROME_RENK.pine : CHROME_RENK.border}`,
                background: secili ? CHROME_RENK.pine : CHROME_RENK.paper, color: secili ? CHROME_RENK.paper : CHROME_RENK.ink,
              }}
            >
              {s.etiket}
            </button>
          )
        })}
      </div>
      {tur && <GonderDugmesi key={`${randevuId}:${tur}`} acikBaslat tur={tur} randevuId={randevuId} patientId={patientId} />}
    </div>
  )
}
