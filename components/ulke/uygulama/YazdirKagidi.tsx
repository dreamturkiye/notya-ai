'use client'

/**
 * AMELIYAT-NOTU-01 — a PRINTED RECORD on the doctor's letterhead (a tool marked `yazdirilir`: operation note, ultrasound
 * report, CTG, discharge summary). The same paper as Türkiye's (components/doktor/yazdir/AntetliKagit.tsx on main):
 * the doctor's name with the title and post-nominals set in Settings, the patient, the day, the record, a signature
 * line. One button prints exactly this record: only the paper whose button was pressed is visible to the printer.
 *
 * NO WORD IS WRITTEN HERE: every string arrives from the pack (araclarMetni). Nothing is stored or sent.
 */
import React, { useEffect, useState } from 'react'
import { yerine } from '@/lib/ulke/arayuz/yerTutucu'

const CSS = `
.uza-yazdir-kagit { display: none; }
@media print {
  body * { visibility: hidden !important; }
  .uza-yazdir-kagit[data-yazdir-aktif='evet'], .uza-yazdir-kagit[data-yazdir-aktif='evet'] * { visibility: visible !important; }
  .uza-yazdir-kagit[data-yazdir-aktif='evet'] { display: block; position: absolute; left: 0; top: 0; width: 100%; font-family: Georgia, 'Times New Roman', serif; color: #111; }
  @page { size: A4; margin: 14mm; }
}
`

export type YazdirAntet = { hekim: string; hasta: string | null; tarih: string }
export type YazdirSozleri = { yazdir: string; yazdirHasta: string; yazdirTarih: string; yazdirImza: string }

export function YazdirKagidi({ baslik, ozet, antet, s }: { baslik: string; ozet: string; antet: YazdirAntet; s: YazdirSozleri }) {
  const [aktif, setAktif] = useState(false)
  useEffect(() => {
    if (!aktif) return
    const bitti = () => setAktif(false)
    window.addEventListener('afterprint', bitti)
    const t = window.setTimeout(() => window.print(), 0)
    return () => { window.clearTimeout(t); window.removeEventListener('afterprint', bitti) }
  }, [aktif])
  return (
    <>
      <style>{CSS}</style>
      <button type="button" className="uza-dugme uza-dugme-cizgi uza-dugme-kucuk" data-eylem="yazdir" onClick={() => setAktif(true)}>{s.yazdir}</button>
      <div className="uza-yazdir-kagit" data-yazdir-aktif={aktif ? 'evet' : undefined} data-yazdir-kagidi>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, borderBottom: '2px solid #222', paddingBottom: 8 }}>
          <div style={{ fontSize: 16, fontWeight: 700 }} data-antet="hekim">{antet.hekim}</div>
          <div style={{ fontSize: 12, textAlign: 'right' }}>
            {antet.hasta ? <div data-antet="hasta">{yerine(s.yazdirHasta, antet.hasta)}</div> : null}
            <div data-antet="tarih">{yerine(s.yazdirTarih, antet.tarih)}</div>
          </div>
        </div>
        <h1 style={{ fontSize: 18, textAlign: 'center', margin: '14px 0 10px' }}>{baslik}</h1>
        <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: 12.5, lineHeight: 1.5, margin: 0 }}>{ozet}</pre>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 36 }}>
          <div style={{ borderTop: '1px solid #333', width: 260, paddingTop: 4, fontSize: 12, textAlign: 'center' }}>{antet.hekim} — {s.yazdirImza}</div>
        </div>
      </div>
    </>
  )
}

/** The print words of the pack's tools text, or null when the pack has none (the pack check requires them for a printed tool). */
export function yazdirSozleri(a: { arac: { yazdir?: string; yazdirHasta?: string; yazdirTarih?: string; yazdirImza?: string } }): YazdirSozleri | null {
  const { yazdir, yazdirHasta, yazdirTarih, yazdirImza } = a.arac
  return yazdir && yazdirHasta && yazdirTarih && yazdirImza ? { yazdir, yazdirHasta, yazdirTarih, yazdirImza } : null
}
