'use client'
/**
 * HASTA-PORTALI-GUNLUK — Sağlık Karnesi badge medallions, drawn as original SVG (no stock art): five silhouettes
 * (rosette medal, shield, star burst, hexagon, drop), seven enamel palettes, a white line glyph and, for count badges,
 * a serif numeral. A locked badge is drawn in pewter with a progress arc and a small lock — it shows what is coming,
 * never a failure. Presentational and wordless (the name / text are rendered by the caller).
 */
import { useId } from 'react'
import type { RozetTanimi } from '@/lib/saglikEvi/rozetler'

const PALET: Record<RozetTanimi['renk'], [string, string, string]> = {
  cam: ['#8fe0d6', '#0f9b8e', '#085e56'],
  gunes: ['#f6dc9a', '#c8962f', '#7f5a1a'],
  mercan: ['#f5bea6', '#c46a4a', '#843b24'],
  gece: ['#9db4c7', '#3d5a73', '#1e3144'],
  nane: ['#c7e8cd', '#4f9a6a', '#2a613f'],
  erik: ['#dcbde0', '#8a5a92', '#52305a'],
  bakir: ['#f3caa4', '#b5743f', '#71431f'],
}
const KALAY: [string, string, string] = ['#e7e2da', '#b9b0a4', '#857b6f']

function sekilYolu(sekil: RozetTanimi['sekil']): string {
  const c = 50
  if (sekil === 'kalkan') return 'M50 8 L84 20 C84 52 72 76 50 92 C28 76 16 52 16 20 Z'
  if (sekil === 'altigen') { const p = Array.from({ length: 6 }, (_, i) => { const a = (Math.PI / 3) * i - Math.PI / 2; return `${c + 40 * Math.cos(a)},${c + 40 * Math.sin(a)}` }); return `M${p.join(' L')} Z` }
  if (sekil === 'damla') return 'M50 8 C64 28 82 44 82 62 C82 80 67 92 50 92 C33 92 18 80 18 62 C18 44 36 28 50 8 Z'
  if (sekil === 'yildiz') { const p = Array.from({ length: 16 }, (_, i) => { const a = (Math.PI / 8) * i - Math.PI / 2; const r = i % 2 ? 33 : 42; return `${(c + r * Math.cos(a)).toFixed(2)},${(c + r * Math.sin(a)).toFixed(2)}` }); return `M${p.join(' L')} Z` }
  // madalya: scalloped rosette (18 lobes)
  const p: string[] = []
  for (let i = 0; i < 36; i++) { const a = (Math.PI / 18) * i - Math.PI / 2; const r = i % 2 ? 37 : 41; p.push(`${(c + r * Math.cos(a)).toFixed(2)},${(c + r * Math.sin(a)).toFixed(2)}`) }
  return `M${p.join(' L')} Z`
}

/** 24×24 line glyphs, centred at (50, 50) by the caller's transform. */
function Simge({ ad }: { ad: RozetTanimi['simge'] }) {
  const s = { fill: 'none', stroke: '#fff', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (ad) {
    case 'ayak': return <g {...s}><path d="M8 20c-2.5 0-3.5-2.5-3-5s2-5 4.5-5S13 12 12.5 15 10.5 20 8 20z" /><path d="M16.5 13c-2 0-3-2-2.6-4.2S15.6 4.5 17.7 4.6 21 7 20.6 9.3 18.5 13 16.5 13z" /></g>
    case 'alev': return <g {...s}><path d="M12 21c-4 0-6.5-2.8-6.5-6.3C5.5 10 10 8.5 9.5 3c3.5 2 7 5.6 7 9.6 1-.8 1.6-2 1.7-3.3 1.2 1.4 1.8 3.2 1.8 5 0 3.8-3.3 6.7-8 6.7z" /><path d="M12 21c-1.8 0-3-1.3-3-3 0-2.3 2.2-3 2.2-5.3 1.8 1 3.8 2.8 3.8 5 0 1.8-1.2 3.3-3 3.3z" /></g>
    case 'ay': return <g {...s}><path d="M15.5 3.5a8.5 8.5 0 1 0 5 13.7A7 7 0 0 1 15.5 3.5z" /><path d="M18 5.5l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4L16 7.5l1.4-.6z" /></g>
    case 'kalem': return <g {...s}><path d="M4 20l1-5L15.5 4.5a2.1 2.1 0 0 1 3 3L8 18l-4 2z" /><path d="M13.5 6.5l3 3" /><path d="M4 20h7" /></g>
    case 'yuz': return <g {...s}><path d="M4 8l2-1.5V17" /><ellipse cx="11" cy="12" rx="2.6" ry="5" /><ellipse cx="18" cy="12" rx="2.6" ry="5" /></g>
    case 'gunes': return <g {...s}><circle cx="12" cy="13" r="4.2" /><path d="M12 3.5v2M4.5 13h2M17.5 13h2M6.5 7.5l1.4 1.4M17.5 7.5l-1.4 1.4M3 20h18" /></g>
    case 'damla': return <g {...s}><path d="M12 3.5c3 4 6 7 6 10.5a6 6 0 0 1-12 0c0-3.5 3-6.5 6-10.5z" /><path d="M9.5 14.5a2.6 2.6 0 0 0 2.5 2.5" /></g>
    case 'kalp': return <g {...s}><path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.6 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z" /><path d="M6.5 12.5h3l1.3-2.3 2 4.3 1.3-2h3.4" /></g>
    case 'hap': return <g {...s}><rect x="3.5" y="8.5" width="17" height="7" rx="3.5" transform="rotate(-35 12 12)" /><path d="M9.6 8.6l4.8 6.8" /></g>
    case 'hedef': return <g {...s}><circle cx="11" cy="13" r="7" /><circle cx="11" cy="13" r="3.4" /><path d="M11 13l8-8M16 5h3v3" /></g>
    case 'tam': return <g {...s}><circle cx="12" cy="12" r="8" /><path d="M8 12.3l2.7 2.7L16.2 9" /></g>
    case 'kalkan': return <g {...s}><path d="M12 3.5l7 2.6c0 6-2.6 10.6-7 13.4-4.4-2.8-7-7.4-7-13.4z" /><path d="M9 11.8l2.2 2.2 4-4.2" /></g>
    case 'kamera': return <g {...s}><path d="M4 8.5h3l1.6-2.5h6.8L17 8.5h3v10H4z" /><circle cx="12" cy="13.3" r="3.3" /></g>
  }
}

const SAYI: Partial<Record<string, string>> = { 'seri-7': '7', 'seri-30': '30', 'olcum-25': '25', 'olcum-100': '100' }

export function RozetSvg({ rozet, kilitli, ilerleme = 0, buyuk = false }: { rozet: Pick<RozetTanimi, 'id' | 'renk' | 'sekil' | 'simge'>; kilitli: boolean; ilerleme?: number; buyuk?: boolean }) {
  const id = useId().replace(/:/g, '')
  const [acik, orta, koyu] = kilitli ? KALAY : PALET[rozet.renk]
  const yol = sekilYolu(rozet.sekil)
  const sayi = SAYI[rozet.id]
  const kurdele = rozet.sekil === 'madalya'
  const cevre = 2 * Math.PI * 47
  return (
    <svg viewBox="0 0 100 112" aria-hidden>
      <defs>
        <radialGradient id={`g${id}`} cx="38%" cy="30%" r="75%"><stop offset="0%" stopColor={acik} /><stop offset="55%" stopColor={orta} /><stop offset="100%" stopColor={koyu} /></radialGradient>
        <linearGradient id={`k${id}`} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={orta} /><stop offset="100%" stopColor={koyu} /></linearGradient>
        <clipPath id={`c${id}`}><path d={yol} /></clipPath>
      </defs>
      {buyuk && !kilitli ? <circle className="sge-isilti" cx="50" cy="50" r="46" fill="none" stroke={orta} strokeWidth="3" /> : null}
      {kurdele ? (
        <g>
          <path d="M34 74 L26 106 L37 99 L44 108 L50 78 Z" fill={`url(#k${id})`} />
          <path d="M66 74 L74 106 L63 99 L56 108 L50 78 Z" fill={`url(#k${id})`} />
        </g>
      ) : null}
      <path d={yol} fill={`url(#g${id})`} stroke={koyu} strokeWidth="1.5" />
      <g clipPath={`url(#c${id})`}>
        <ellipse cx="40" cy="22" rx="34" ry="16" fill="#fff" opacity={kilitli ? 0.18 : 0.28} />
      </g>
      <circle cx="50" cy="50" r="27" fill={koyu} opacity="0.32" />
      <circle cx="50" cy="50" r="27" fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="1.4" strokeDasharray="2 2.6" />
      {sayi ? (
        <g opacity={kilitli ? 0.75 : 1}>
          <g transform="translate(42.8 27) scale(0.6)"><Simge ad={rozet.simge} /></g>
          <text x="50" y="62" textAnchor="middle" fontFamily="var(--sg-font-display), Georgia, serif" fontSize={sayi.length > 2 ? 17 : 21} fontWeight="600" fill="#fff">{sayi}</text>
        </g>
      ) : (
        <g transform="translate(35 35) scale(1.25)" opacity={kilitli ? 0.75 : 1}><Simge ad={rozet.simge} /></g>
      )}
      {kilitli ? (
        <g>
          {ilerleme > 0 ? <circle cx="50" cy="50" r="47" fill="none" stroke="#0f9b8e" strokeWidth="3" strokeLinecap="round" strokeDasharray={cevre} strokeDashoffset={cevre * (1 - Math.min(1, ilerleme))} transform="rotate(-90 50 50)" /> : null}
          <g transform="translate(70 70)">
            <circle r="11" fill="#fffdf8" stroke="#b9b0a4" />
            <rect x="-5" y="-1.5" width="10" height="8" rx="1.6" fill="#857b6f" />
            <path d="M-3 -1.5v-2.5a3 3 0 0 1 6 0v2.5" fill="none" stroke="#857b6f" strokeWidth="1.8" />
          </g>
        </g>
      ) : null}
    </svg>
  )
}
