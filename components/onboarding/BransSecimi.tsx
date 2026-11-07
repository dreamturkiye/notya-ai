'use client';

import React from 'react';
import { CHROME_RENK, CHROME_FONT } from '@/lib/doktor/chromeTheme';
import { KAYIT_BRANS_GRUPLARI } from '@/lib/onboarding/kayitBransi';

/**
 * KAYIT-BRANS-01 (Kaan, 2026-11-07) — the ONE branch select: /kayit, onboarding step 2 and the "Branşınızı seçin" gate
 * of the doctor app. 40 options in two groups ("Tıp Branşları", "Özel Branşlar"); the value is the canonical key.
 * Nothing is preselected: the first option is an empty, disabled "Branşınızı seçin" placeholder, so an untouched
 * select is always empty and the caller refuses it.
 */
export default function BransSecimi({ deger, onDegis, kimlik = 'brans-secimi', etiket = 'Branşınız', hata, girdiStili }: {
  deger: string;
  onDegis: (anahtar: string) => void;
  kimlik?: string;
  etiket?: string;
  /** Shown under the select (Turkish), e.g. "Lütfen branşınızı seçin." */
  hata?: string | null;
  /** The caller's input style, so the select looks exactly like the fields around it. */
  girdiStili?: React.CSSProperties;
}) {
  const R = CHROME_RENK;
  const stil: React.CSSProperties = girdiStili ?? {
    width: '100%', backgroundColor: R.paper, color: R.ink, border: `1px solid ${R.border}`, borderRadius: 8,
    padding: 12, fontSize: 15, fontFamily: CHROME_FONT.sans, boxSizing: 'border-box',
  };
  return (
    <div data-alan="brans-secimi">
      <label htmlFor={kimlik} style={{ color: R.muted, fontSize: 14, marginBottom: 8, display: 'block' }}>{etiket}</label>
      <select
        id={kimlik}
        name="specialty"
        required
        aria-required="true"
        aria-invalid={hata ? true : undefined}
        value={deger}
        onChange={(e) => onDegis(e.target.value)}
        style={{ ...stil, color: deger ? R.ink : R.muted, appearance: 'auto' }}
      >
        <option value="" disabled>Branşınızı seçin</option>
        {KAYIT_BRANS_GRUPLARI.map((g) => (
          <optgroup key={g.baslik} label={g.baslik}>
            {g.secenekler.map((s) => <option key={s.anahtar} value={s.anahtar} style={{ color: R.ink }}>{s.ad}</option>)}
          </optgroup>
        ))}
      </select>
      {hata ? <div role="alert" style={{ color: R.warn, fontSize: 13, marginTop: 6, lineHeight: 1.45 }}>{hata}</div> : null}
    </div>
  );
}
