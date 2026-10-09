'use client';

import React from 'react';
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

/**
 * NOTYA-ONBOARDING-01 (Kaan, 2026-10-09) — the KVKK explicit-consent box, for onboarding.
 *
 * Wording, link (/kvkk) and look are EXACTLY those of the box in app/kayit/page.tsx; no new legal wording was
 * written. /kayit is untouched, so its own box stays where it is; lib/onboarding/adimUi.test.ts reads the /kayit
 * source on every run to prove the two texts have not drifted apart. Never pre-ticked.
 */
export default function KvkkOnayKutusu({ isaretli, onDegis }: { isaretli: boolean; onDegis: (isaretli: boolean) => void }) {
  const R = CHROME_RENK;
  return (
    <label data-kvkk-onay style={{
      display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, lineHeight: 1.55, marginBottom: 18,
      color: R.ink, cursor: 'pointer',
    }}>
      <input
        type="checkbox"
        checked={isaretli}
        onChange={(e) => onDegis(e.target.checked)}
        style={{ marginTop: 3, width: 16, height: 16, flexShrink: 0, cursor: 'pointer', accentColor: R.pine }}
      />
      <span>
        <a href="/kvkk" target="_blank" rel="noopener noreferrer" style={{ color: R.pine, fontWeight: 600 }}>
          KVKK Aydınlatma Metni
        </a>
        &apos;ni okudum. Kişisel verilerimin ve hastalarıma ait sağlık verilerinin metinde
        açıklanan amaçlarla işlenmesini ve belirtilen hizmet sağlayıcılara aktarılmasını kabul
        ediyorum.
      </span>
    </label>
  );
}
