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
import { ulkeYolu } from '@/lib/ulke/yol'
import { butunlukOzeti, dogrulamaAdresi } from '@/lib/belge/belge'
import QrKod from '@/components/belge/QrKod'
import type { Api } from './Kabuk'

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
export type YazdirSozleri = { yazdir: string; yazdirHasta: string; yazdirTarih: string; yazdirImza: string; belge?: BelgeSozleri }
/** BELGE-NO-01 — the words of the document number block (the pack's; absent = the paper is printed as before). */
export type BelgeSozleri = { belgeNo: string; belgeRev: string; belgeTarih: string; belgeDogrula: string; belgeGerekce: string; belgeKayitsiz: string }
/**
 * BELGE-NO-01 — what identifies the printed record: a kept record's id (`kaynakId`: the record never changes, so its
 * printout is always revision 0), or for a fresh result the tool's key (`onEk`) with the content's hash, so that each
 * different result is its own document and the same result printed twice keeps its number.
 */
export type YazdirBelgesi = { kaynakId?: string; onEk?: string; hastaId: string | null; api: Api; /** The kind of record; a tool's result when absent. */ tur?: 'arac_kaydi' | 'hasta_disa_aktarim' }
type Kunye = { belgeNo: string; rev: number; tarih: string; kod: string } | 'kayitsiz' | null

/**
 * BELGE-NO-01 — register the printout: the browser sends only the SHA-256 of what is printed (no text, no patient value);
 * a record printed again with other content asks for the reason of the new revision. Any failure prints the paper with
 * the line that it is not registered: printing is never blocked.
 */
async function kaydet(b: YazdirBelgesi, baslik: string, ozet: string, gerekceSorusu: string): Promise<Kunye> {
  try {
    const hash = await butunlukOzeti({ baslik, ozet })
    const kaynakId = b.kaynakId ?? `${b.onEk ?? 'arac'}:${hash.slice(0, 16)}`
    const gonder = (gerekce?: string) => b.api('/api/ulke/belge', { method: 'POST', govde: { kaynakId, hastaId: b.hastaId, ...(b.tur ? { tur: b.tur } : {}), ozet: hash, ...(gerekce ? { gerekce } : {}) } })
    let r = await gonder()
    if (r.ok && r.j.durum === 'gerekce_gerekli') {
      const gerekce = (window.prompt(gerekceSorusu) ?? '').trim()
      if (gerekce.length < 3) return 'kayitsiz'
      r = await gonder(gerekce)
    }
    return r.ok && r.j.durum === 'tamam' ? { belgeNo: String(r.j.belgeNo), rev: Number(r.j.rev), tarih: String(r.j.tarih), kod: String(r.j.kod) } : 'kayitsiz'
  } catch { return 'kayitsiz' }
}

export function YazdirKagidi({ baslik, ozet, antet, s, belge }: { baslik: string; ozet: string; antet: YazdirAntet; s: YazdirSozleri; belge?: YazdirBelgesi }) {
  const [aktif, setAktif] = useState(false)
  const [kunye, setKunye] = useState<Kunye>(null)
  const [bekliyor, setBekliyor] = useState(false)
  const yazdir = async () => {
    if (belge && s.belge && !bekliyor) { setBekliyor(true); setKunye(await kaydet(belge, baslik, ozet, s.belge.belgeGerekce)); setBekliyor(false) }
    setAktif(true)
  }
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
      <button type="button" className="uza-dugme uza-dugme-cizgi uza-dugme-kucuk" data-eylem="yazdir" disabled={bekliyor} onClick={() => { void yazdir() }}>{s.yazdir}</button>
      <div className="uza-yazdir-kagit" data-yazdir-aktif={aktif ? 'evet' : undefined} data-yazdir-kagidi>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, borderBottom: '2px solid #222', paddingBottom: 8 }}>
          <div style={{ fontSize: 16, fontWeight: 700 }} data-antet="hekim">{antet.hekim}</div>
          <div style={{ fontSize: 12, textAlign: 'right' }}>
            {antet.hasta ? <div data-antet="hasta">{yerine(s.yazdirHasta, antet.hasta)}</div> : null}
            <div data-antet="tarih">{yerine(s.yazdirTarih, antet.tarih)}</div>
          </div>
        </div>
        <h1 style={{ fontSize: 18, textAlign: 'center', margin: '14px 0 10px' }}>{baslik}</h1>
        {s.belge && kunye === 'kayitsiz' ? <div style={{ fontSize: 11, color: '#555', margin: '0 0 10px' }} data-belge="kayitsiz">{s.belge.belgeKayitsiz}</div> : null}
        {s.belge && kunye && kunye !== 'kayitsiz' ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, border: '1px solid #ccc', padding: '6px 10px', margin: '0 0 12px', fontSize: 11 }} data-belge="kunye">
            <div>
              <div>{yerine(s.belge.belgeNo, kunye.belgeNo)}</div>
              <div>{yerine(s.belge.belgeRev, String(kunye.rev))} · {yerine(s.belge.belgeTarih, kunye.tarih.slice(0, 10))}</div>
              <div style={{ color: '#555' }}>{s.belge.belgeDogrula}</div>
            </div>
            <QrKod metin={dogrulamaAdresi(typeof window === 'undefined' ? '' : window.location.origin, ulkeYolu('/verify'), kunye.kod)} boyut={72} etiket={s.belge.belgeDogrula} />
          </div>
        ) : null}
        <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: 12.5, lineHeight: 1.5, margin: 0 }}>{ozet}</pre>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 36 }}>
          <div style={{ borderTop: '1px solid #333', width: 260, paddingTop: 4, fontSize: 12, textAlign: 'center' }}>{antet.hekim} — {s.yazdirImza}</div>
        </div>
      </div>
    </>
  )
}

/** The print words of the pack's tools text, or null when the pack has none (the pack check requires them for a printed tool). */
export function yazdirSozleri(a: { arac: { yazdir?: string; yazdirHasta?: string; yazdirTarih?: string; yazdirImza?: string; belgeNo?: string; belgeRev?: string; belgeTarih?: string; belgeDogrula?: string; belgeGerekce?: string; belgeKayitsiz?: string } }): YazdirSozleri | null {
  const { yazdir, yazdirHasta, yazdirTarih, yazdirImza, belgeNo, belgeRev, belgeTarih, belgeDogrula, belgeGerekce, belgeKayitsiz } = a.arac
  const belge = belgeNo && belgeRev && belgeTarih && belgeDogrula && belgeGerekce && belgeKayitsiz ? { belgeNo, belgeRev, belgeTarih, belgeDogrula, belgeGerekce, belgeKayitsiz } : undefined
  return yazdir && yazdirHasta && yazdirTarih && yazdirImza ? { yazdir, yazdirHasta, yazdirTarih, yazdirImza, ...(belge ? { belge } : {}) } : null
}
