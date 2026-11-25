'use client'
/**
 * EV-ACIL-SEKER (Kaan, 2026-11-25) — the calm symptom check after a very high glucose (≥ the acil threshold, default 400
 * mg/dL, or a meter "HI"). One tap: any red flag (kusma, karın ağrısı, bilinç bulanıklığı / aşırı uyku hali, çok susama /
 * sık idrar, derin-hızlı nefes, nefeste meyve kokusu — SB Diyabet Klinik Protokolleri §3.2, TEMD DM Kılavuzu, ADA
 * Standards of Care—2026) → a big "112'yi ara" button + "Doktorunuza da bildirdik"; none → rest, drink water unless told
 * otherwise, re-measure in 15–30 min. With an active insulin: "keton çubuğunuz varsa ölçün". Never a dose instruction.
 * The doctor has already been notified by the rule engine (acil level); this view only guides the patient. Shared view:
 * every word comes from `s` (one look in every country — gorunum-paritesi-ulke).
 */
import { useState } from 'react'
import type { SaglikEviSozleri } from '@/lib/saglikEvi/sozler'
import { TelefonIkonu } from './UyariKarti'

export function SekerAcilKontrolu({ s, keton, isaret, degerMetni, bitti, baslikGoster = true, baslangic = 'soru' }: { s: SaglikEviSozleri; keton: boolean; isaret?: 'hi' | 'lo' | null; degerMetni?: string | null; bitti?: () => void; baslikGoster?: boolean; baslangic?: 'soru' | '112' | 'sakin' }) {
  const [adim, setAdim] = useState<'soru' | '112' | 'sakin'>(baslangic)
  const baslik = isaret === 'hi' ? s.sekerAcilBaslikHi : s.sekerAcilBaslik
  if (adim === '112') {
    return (
      <div className="sge-sacil" role="alert" data-adim="112">
        <div className="sge-sacil-bas"><h3>{s.sekerAcil112Baslik}</h3><p>{s.sekerAcil112Metin}</p></div>
        <a className="sge-sacil-112" href={`tel:${s.acilTel}`} data-testid="seker-acil-112"><TelefonIkonu boyut={28} />{s.ara112}</a>
        {bitti ? <button type="button" className="sge-uyari-okudum" onClick={bitti}>{s.kapat}</button> : null}
      </div>
    )
  }
  if (adim === 'sakin') {
    return (
      <div className="sge-sacil" role="status" data-adim="sakin">
        <div className="sge-sacil-bas"><h3>{s.sekerAcilSakinBaslik}</h3><p>{s.sekerAcilDoktor}</p></div>
        <ol className="sge-sacil-liste">{s.sekerAcilSakin.map((m, i) => <li key={m}><i aria-hidden>{i + 1}</i><span>{m}</span></li>)}</ol>
        {keton ? <p className="sge-sacil-keton" data-testid="seker-acil-keton">{s.sekerAcilKeton}</p> : null}
        <p className="sge-sacil-not">{s.sekerAcilTekrar}</p>
        <a className="sge-112" href={`tel:${s.acilTel}`} style={{ marginTop: 12 }}><TelefonIkonu />{s.ara112}</a>
        {bitti ? <button type="button" className="sge-kaydet" onClick={bitti}>{s.sekerAcilTamam}</button> : null}
      </div>
    )
  }
  return (
    <div className="sge-sacil" data-adim="soru">
      <div className="sge-sacil-bas">
        {baslikGoster ? <h3>{baslik}{degerMetni ? ` · ${degerMetni}` : ''}</h3> : null}
        <p>{s.sekerAcilAlt}</p>
      </div>
      <ul className="sge-sacil-belirtiler" aria-label={s.sekerAcilAlt}>
        {s.sekerAcilBelirtiler.map((b) => (
          <li key={b}><button type="button" className="sge-sacil-belirti" aria-label={s.sekerAcilBelirtiAria(b)} onClick={() => setAdim('112')}><span>{b}</span><span aria-hidden>{s.sekerAcilVar}</span></button></li>
        ))}
      </ul>
      <button type="button" className="sge-sacil-yok" onClick={() => setAdim('sakin')}>{s.sekerAcilHicbiri}</button>
      {baslikGoster ? <p className="sge-sacil-not" style={{ textAlign: 'center' }}><a className="sge-baglanti" href={`tel:${s.acilTel}`}>{s.ara112}</a></p> : null}
    </div>
  )
}
