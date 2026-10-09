'use client';

import React from 'react';
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

/**
 * NOTYA-ONBOARDING-01 (Kaan, 2026-10-09) — KVKK açık rıza kutusu, onboarding için.
 *
 * Metin, bağlantı (/kvkk) ve görünüm app/kayit/page.tsx içindeki kutuyla BİREBİR aynıdır; yeni hukuki metin
 * yazılmadı. /kayit dosyasına dokunulmadığı için kutu orada yerinde durur; iki metnin ayrışmadığını
 * lib/onboarding/adimUi.test.ts her çalıştığında /kayit kaynağını okuyarak doğrular. Asla önceden işaretli gelmez.
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
