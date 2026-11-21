'use client';

/**
 * SURE-SECIM-01 (beta feedback, 2026-11-21): the appointment's "Süre (dk)" field showed "2030" — the prefilled 20 stayed
 * and the typed 30 was appended (the old field also refused to be emptied: an empty value snapped back to 20). Duration
 * is now a quick choice: chips for the usual lengths and "Diğer" for any other number. The custom field selects its
 * whole content on focus, keeps what is typed as text while typing, and only commits a valid number.
 *
 * No word is written here: the unit and the "other" label are the caller's.
 */
import React, { useEffect, useState } from 'react';
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';
import { tumunuSec } from '@/lib/doktor/sayiGirdi';

export const HIZLI_SURELER = [10, 15, 20, 30, 45, 60] as const;
export const SURE_EN_AZ = 5;
export const SURE_EN_COK = 480;

/** A typed duration → minutes, or null while it is not a usable number (empty, text, out of range). */
export function sureMetniCoz(metin: string): number | null {
  const t = metin.trim();
  if (!/^\d{1,3}$/.test(t)) return null;
  const n = Number(t);
  return n >= SURE_EN_AZ && n <= SURE_EN_COK ? n : null;
}

export default function SureSecici({ deger, degistir, birim, digerEtiketi, etiketId, sureler = HIZLI_SURELER }: {
  deger: number;
  degistir: (dk: number) => void;
  /** "dk" / "min" … */
  birim: string;
  /** "Diğer" / "Other" … */
  digerEtiketi: string;
  /** id of the visible label, for aria-labelledby. */
  etiketId?: string;
  sureler?: readonly number[];
}) {
  const hizli = sureler.includes(deger);
  const [ozelAcik, setOzelAcik] = useState(!hizli);
  const [metin, setMetin] = useState(hizli ? '' : String(deger));
  // An edited appointment with an unusual length opens with the custom field showing it.
  useEffect(() => { if (!sureler.includes(deger)) { setOzelAcik(true); setMetin(String(deger)); } }, [deger, sureler]);

  const cip = (secili: boolean): React.CSSProperties => ({
    minHeight: 40, minWidth: 52, padding: '0 12px', borderRadius: 999, cursor: 'pointer', fontFamily: 'inherit',
    fontSize: 14, fontWeight: secili ? 700 : 600,
    border: `1px solid ${secili ? CHROME_RENK.pine : 'rgba(58,44,34,0.18)'}`,
    background: secili ? CHROME_RENK.pine : '#FFFFFF', color: secili ? '#FAF8F4' : CHROME_RENK.ink,
  });

  return (
    <div role="radiogroup" aria-labelledby={etiketId} data-sure-secici="" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
      {sureler.map((s) => (
        <button key={s} type="button" role="radio" aria-checked={!ozelAcik && deger === s} style={cip(!ozelAcik && deger === s)}
          onClick={() => { setOzelAcik(false); setMetin(''); degistir(s); }}>
          {s} {birim}
        </button>
      ))}
      <button type="button" role="radio" aria-checked={ozelAcik} style={cip(ozelAcik)} onClick={() => { setOzelAcik(true); setMetin(String(deger)); }}>
        {digerEtiketi}
      </button>
      {ozelAcik && (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <input
            className="ni-input"
            inputMode="numeric"
            pattern="[0-9]*"
            aria-label={`${digerEtiketi} (${birim})`}
            value={metin}
            autoFocus={!sureler.includes(deger) ? undefined : true}
            onFocus={tumunuSec}
            onChange={(e) => {
              const t = e.target.value.replace(/[^\d]/g, '').slice(0, 3);
              setMetin(t);
              const n = sureMetniCoz(t);
              if (n !== null) degistir(n);
            }}
            onBlur={() => { if (sureMetniCoz(metin) === null) setMetin(String(deger)); }}
            style={{ width: 84 }}
          />
          <span style={{ fontSize: 13, color: CHROME_RENK.muted }}>{birim}</span>
        </span>
      )}
    </div>
  );
}
