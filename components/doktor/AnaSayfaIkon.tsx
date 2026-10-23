/**
 * AU-LOOK-PARITY-01 — the home screen's tile icons (stroke, one hand), moved out of app/dashboard/doktor/page.tsx so that a
 * country's home draws the SAME icons. Pure; no words.
 */
import React from 'react'

/** Real inline stroke icons — no emoji, one hand, consistent 1.7 weight. */
export function Ikon({ ad, boyut = 22 }: { ad: string; boyut?: number }) {
  const ortak = { width: boyut, height: boyut, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (ad) {
    case 'takvim': return <svg {...ortak}><rect x="3.5" y="5" width="17" height="15.5" rx="3" /><path d="M8 3v4M16 3v4M3.5 10h17" /></svg>
    case 'asistan': return <svg {...ortak}><rect x="9.2" y="3.5" width="5.6" height="10" rx="2.8" /><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v2.5M9 20.5h6" /></svg>
    case 'hastaEkle': return <svg {...ortak}><circle cx="10" cy="8.5" r="3.5" /><path d="M4 20c.6-3.4 3-5.5 6-5.5s5.4 2.1 6 5.5" /><path d="M18.5 8v5M16 10.5h5" /></svg>
    case 'hastalar': return <svg {...ortak}><circle cx="8.5" cy="8" r="2.1" /><circle cx="15.2" cy="9" r="1.6" /><path d="M3.8 18c.5-2.8 2-4.2 4.7-4.2 2.2 0 3.6 1.1 4.3 3" /><path d="M13.2 14.4c1.6-.4 3-.2 4.2.6.8 1.5 1.1 2.8 1.2 3.8" /></svg>
    case 'belge': return <svg {...ortak}><path d="M7 3.5h7l4 4V19a1.8 1.8 0 0 1-1.8 1.8H7A1.8 1.8 0 0 1 5.2 19V5.3A1.8 1.8 0 0 1 7 3.5Z" /><path d="M14 3.5V8h4.5" /></svg>
    case 'epikriz': return <svg {...ortak}><path d="M6 4h12v16H6z" /><path d="M9 9h6M9 12h6M9 15h4" /></svg>
    case 'icd': return <svg {...ortak}><circle cx="12" cy="12" r="7" /><path d="M9 12h6M12 9v6" /></svg>
    case 'boy': return <svg {...ortak}><path d="M8 4v16M8 6h3M8 12h2.2M8 18h3" /><path d="M14 16c1.6-4 3-6.4 5-8" /></svg>
    case 'inceleme': return <svg {...ortak}><rect x="4.5" y="4.5" width="15" height="16" rx="2.5" /><path d="m8.6 13.6 2.2 2.2 4.6-4.8" /></svg>
    case 'araclar': return <svg {...ortak}><path d="M4 7.5h9M17 7.5h3M4 16.5h3M11 16.5h9" /><circle cx="15" cy="7.5" r="2.2" /><circle cx="9" cy="16.5" r="2.2" /></svg>
    case 'raporlar': return <svg {...ortak}><path d="M4.5 20V4.5M4.5 20H20" /><path d="M8.5 16.5v-5M12.5 16.5V8M16.5 16.5v-8.5" /></svg>
    default: return null
  }
}
