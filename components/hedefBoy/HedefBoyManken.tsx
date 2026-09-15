'use client'

/**
 * Aile stüdyosu: baba – tahmini çocuk – anne, boy ölçer ile.
 * Tanner hedef boyunu ebeveyne göstermek için (cila; tanı değil).
 */
import { useId, type CSSProperties } from 'react'
import type { HedefBoySonuc } from '@/lib/clinical/hedefBoy'
import { formatBoyCm } from '@/lib/clinical/hedefBoy'

export type HedefBoyGorsel = Pick<HedefBoySonuc, 'anneCm' | 'babaCm' | 'cocukCm' | 'altCm' | 'ustCm' | 'cinsiyet'>
type Tema = 'doktor' | 'portal'

const T: Record<Tema, {
  baba: string; babaKoyu: string; babaAcik: string
  anne: string; anneKoyu: string; anneAcik: string
  cocuk: string; cocukKoyu: string; cocukAcik: string
  yazi: string; soluk: string; olcer: string; olcerCizgi: string
  zemin: string; sahne: string; spot: string; yildiz: string
}> = {
  doktor: {
    baba: '#5BA8D9', babaKoyu: '#1E4F73', babaAcik: '#A9D8F2',
    anne: '#E07A8D', anneKoyu: '#8A3348', anneAcik: '#F5B8C4',
    cocuk: '#E8C547', cocukKoyu: '#8A6914', cocukAcik: '#FDE68A',
    yazi: '#F4F1E8', soluk: '#A8B4C4',
    olcer: '#D7C4A3', olcerCizgi: '#5C4A32',
    zemin: 'rgba(232,197,71,0.18)', sahne: '#07101C', spot: 'rgba(232,197,71,0.22)',
    yildiz: '#FDE68A',
  },
  portal: {
    baba: '#1A6B7A', babaKoyu: '#0C3D47', babaAcik: '#7EB8C4',
    anne: '#C45C48', anneKoyu: '#7A2E24', anneAcik: '#E8A090',
    cocuk: '#C9A227', cocukKoyu: '#7A6410', cocukAcik: '#E8D48A',
    yazi: '#0A1628', soluk: '#6B7385',
    olcer: '#E8D9C0', olcerCizgi: '#6B5438',
    zemin: 'rgba(201,162,39,0.16)', sahne: '#FBF7F0', spot: 'rgba(201,162,39,0.28)',
    yildiz: '#C9A227',
  },
}

/** Ayaklar y=0, tepe ≈ −188 — stüdyo silüetleri, iki ton hacim. */
function BabaGovde({ a, k, d }: { a: string; k: string; d: string }) {
  return (
    <g>
      <ellipse cx="0" cy="2" rx="20" ry="5" fill="#000" opacity="0.18" />
      <path d="M-18 0 C-20 -6 -16 -10 -8 -10 L-6 0 Z" fill={k} />
      <path d="M18 0 C20 -6 16 -10 8 -10 L6 0 Z" fill={k} />
      <path d="M-15 -10 C-17 -52 -14 -92 -7 -96 L-3 -10 Z" fill={a} />
      <path d="M15 -10 C17 -52 14 -92 7 -96 L3 -10 Z" fill={a} />
      <path d="M-6 -96 L-7 -10 L-3 -10 L-2 -96 Z" fill={k} opacity="0.35" />
      <path d="M6 -96 L7 -10 L3 -10 L2 -96 Z" fill={k} opacity="0.35" />
      <path d="M-26 -142 C-30 -136 -32 -118 -28 -100 L-18 -98 C-16 -118 -14 -136 -12 -142 Z" fill={a} />
      <path d="M26 -142 C30 -136 32 -118 28 -100 L18 -98 C16 -118 14 -136 12 -142 Z" fill={a} />
      <path d="M-24 -146 C-8 -154 8 -154 24 -146 L18 -96 C8 -100 -8 -100 -18 -96 Z" fill={a} />
      <path d="M-8 -146 L8 -146 L6 -96 L-6 -96 Z" fill={d} opacity="0.55" />
      <path d="M-6 -146 L0 -128 L6 -146 Z" fill={d} />
      <rect x="-6" y="-156" width="12" height="12" rx="4" fill={a} />
      <ellipse cx="0" cy="-172" rx="13.5" ry="16" fill={a} />
      <path d="M-13 -176 C-10 -190 10 -190 13 -176 C8 -182 -8 -182 -13 -176 Z" fill={k} />
      <ellipse cx="-13" cy="-170" rx="2.2" ry="3.2" fill={a} />
      <ellipse cx="13" cy="-170" rx="2.2" ry="3.2" fill={a} />
    </g>
  )
}

function AnneGovde({ a, k, d }: { a: string; k: string; d: string }) {
  return (
    <g>
      <ellipse cx="0" cy="2" rx="18" ry="5" fill="#000" opacity="0.16" />
      <path d="M-14 0 C-16 -5 -12 -9 -6 -9 L-4 0 Z" fill={k} />
      <path d="M14 0 C16 -5 12 -9 6 -9 L4 0 Z" fill={k} />
      <path d="M-12 -9 C-13 -40 -10 -78 -5 -82 L-2 -9 Z" fill={a} />
      <path d="M12 -9 C13 -40 10 -78 5 -82 L2 -9 Z" fill={a} />
      <path d="M-16 -86 Q-28 -48 -22 -18 L22 -18 Q28 -48 16 -86 Q0 -78 -16 -86 Z" fill={a} />
      <path d="M-16 -86 Q0 -72 16 -86 Q10 -128 -10 -132 Q-18 -110 -16 -86 Z" fill={a} />
      <path d="M-6 -128 Q0 -118 6 -128 L4 -86 L-4 -86 Z" fill={d} opacity="0.4" />
      <path d="M-20 -138 C-24 -124 -22 -108 -16 -100 L-10 -132 Z" fill={a} />
      <path d="M20 -138 C24 -124 22 -108 16 -100 L10 -132 Z" fill={a} />
      <rect x="-5" y="-150" width="10" height="16" rx="4" fill={a} />
      <ellipse cx="0" cy="-166" rx="12.5" ry="15" fill={a} />
      <path d="M-20 -160 C-22 -188 -4 -196 0 -176 C4 -196 22 -188 20 -160 C12 -170 -12 -170 -20 -160 Z" fill={k} />
      <path d="M-18 -158 C-16 -148 -8 -142 0 -140 C8 -142 16 -148 18 -158" fill={k} opacity="0.55" />
    </g>
  )
}

function CocukErkekGovde({ a, k, d }: { a: string; k: string; d: string }) {
  return (
    <g>
      <ellipse cx="0" cy="2" rx="16" ry="4.5" fill="#000" opacity="0.16" />
      <path d="M-14 0 C-16 -5 -12 -8 -6 -8 L-4 0 Z" fill={k} />
      <path d="M14 0 C16 -5 12 -8 6 -8 L4 0 Z" fill={k} />
      <path d="M-12 -8 C-14 -50 -12 -90 -6 -94 L-2.5 -8 Z" fill={a} />
      <path d="M12 -8 C14 -50 12 -90 6 -94 L2.5 -8 Z" fill={a} />
      <path d="M-22 -140 C-26 -132 -26 -112 -22 -98 L-14 -96 C-12 -116 -12 -132 -10 -140 Z" fill={a} />
      <path d="M22 -140 C26 -132 26 -112 22 -98 L14 -96 C12 -116 12 -132 10 -140 Z" fill={a} />
      <path d="M-20 -144 C-6 -152 6 -152 20 -144 L16 -94 C6 -98 -6 -98 -16 -94 Z" fill={a} />
      <path d="M-6 -144 L6 -144 L5 -94 L-5 -94 Z" fill={d} opacity="0.5" />
      <rect x="-5.5" y="-156" width="11" height="14" rx="4" fill={a} />
      <ellipse cx="0" cy="-172" rx="13" ry="16.5" fill={a} />
      <path d="M-12 -176 C-8 -192 8 -192 12 -176 C6 -184 -6 -184 -12 -176 Z" fill={k} />
      <circle cx="0" cy="-186" r="3.2" fill={d} />
    </g>
  )
}

function CocukKizGovde({ a, k, d }: { a: string; k: string; d: string }) {
  return (
    <g>
      <ellipse cx="0" cy="2" rx="16" ry="4.5" fill="#000" opacity="0.16" />
      <path d="M-12 0 C-14 -4 -10 -8 -5 -8 L-3 0 Z" fill={k} />
      <path d="M12 0 C14 -4 10 -8 5 -8 L3 0 Z" fill={k} />
      <path d="M-10 -8 C-11 -38 -9 -74 -4 -78 L-2 -8 Z" fill={a} />
      <path d="M10 -8 C11 -38 9 -74 4 -78 L2 -8 Z" fill={a} />
      <path d="M-14 -82 Q-26 -44 -20 -16 L20 -16 Q26 -44 14 -82 Q0 -74 -14 -82 Z" fill={a} />
      <path d="M-14 -82 Q0 -70 14 -82 Q8 -126 -8 -130 Q-16 -108 -14 -82 Z" fill={a} />
      <path d="M-5 -126 Q0 -116 5 -126 L3 -82 L-3 -82 Z" fill={d} opacity="0.45" />
      <path d="M-18 -136 C-22 -122 -20 -106 -14 -98 L-9 -128 Z" fill={a} />
      <path d="M18 -136 C22 -122 20 -106 14 -98 L9 -128 Z" fill={a} />
      <rect x="-4.5" y="-148" width="9" height="16" rx="4" fill={a} />
      <ellipse cx="0" cy="-164" rx="12" ry="15" fill={a} />
      <path d="M-18 -158 C-20 -186 -4 -194 0 -174 C4 -194 20 -186 18 -158 C10 -168 -10 -168 -18 -158 Z" fill={k} />
      <circle cx="0" cy="-188" r="3.4" fill={d} />
    </g>
  )
}

function Figür({
  x, cm, cmMin, cmMax, floor, plotH, palet, label, kind, highlight, uid,
}: {
  x: number
  cm: number
  cmMin: number
  cmMax: number
  floor: number
  plotH: number
  palet: { a: string; k: string; d: string }
  label: string
  kind: 'baba' | 'anne' | 'erkek' | 'kiz'
  highlight?: boolean
  uid: string
}) {
  const native = 188
  const pxH = ((cm - cmMin) / (cmMax - cmMin)) * plotH
  const scale = pxH / native
  const Govde = kind === 'baba' ? BabaGovde : kind === 'anne' ? AnneGovde : kind === 'kiz' ? CocukKizGovde : CocukErkekGovde
  return (
    <g transform={`translate(${x} ${floor})`}>
      {highlight && (
        <>
          <ellipse cx="0" cy="8" rx="54" ry="12" fill={palet.d} opacity="0.28" />
          <ellipse cx="0" cy={-pxH * 0.55} rx="70" ry={Math.max(40, pxH * 0.55)} fill={`url(#spot-${uid})`} opacity="0.55" />
        </>
      )}
      <g transform={`scale(${scale})`} filter={highlight ? `url(#parilti-${uid})` : undefined}>
        <Govde a={palet.a} k={palet.k} d={palet.d} />
      </g>
      <g transform={`scale(1, -0.16)`} opacity="0.22">
        <g transform={`scale(${scale})`}>
          <Govde a={palet.a} k={palet.k} d={palet.d} />
        </g>
      </g>
      <text textAnchor="middle" y="28" fill={palet.a} fontSize="14" fontWeight="800" letterSpacing="0.04em">{label}</text>
      <text textAnchor="middle" y="46" fill={palet.d} fontSize="13" fontWeight="700">{Math.round(cm)} cm</text>
    </g>
  )
}

function Olcer({
  uid, cmMin, cmMax, floor, plotH, alt, ust, hedef, tema,
}: {
  uid: string
  cmMin: number
  cmMax: number
  floor: number
  plotH: number
  alt: number
  ust: number
  hedef: number
  tema: Tema
}) {
  const pal = T[tema]
  const y = (cm: number) => floor - ((cm - cmMin) / (cmMax - cmMin)) * plotH
  const ticks: number[] = []
  for (let c = Math.ceil(cmMin / 5) * 5; c <= cmMax; c += 5) ticks.push(c)
  const yAlt = y(alt)
  const yUst = y(ust)
  return (
    <g>
      <rect x="22" y={y(cmMax) - 16} width="46" height={plotH + 28} rx="8" fill={pal.olcer} stroke={pal.olcerCizgi} strokeWidth="1.2" />
      <rect x="22" y={Math.min(yAlt, yUst)} width="46" height={Math.abs(yAlt - yUst)} fill={pal.cocuk} opacity="0.28" />
      {ticks.map((c) => {
        const major = c % 10 === 0
        return (
          <g key={c}>
            <line x1="22" x2={major ? 52 : 40} y1={y(c)} y2={y(c)} stroke={pal.olcerCizgi} strokeWidth={major ? 1.4 : 0.7} opacity={major ? 0.9 : 0.45} />
            {major && (
              <text x="68" y={y(c) + 4} fill={pal.soluk} fontSize="10" fontWeight="700">{c}</text>
            )}
          </g>
        )
      })}
      <line x1="22" x2="68" y1={y(hedef)} y2={y(hedef)} stroke={pal.cocuk} strokeWidth="2.4" />
      <polygon points={`68,${y(hedef)} 80,${y(hedef) - 6} 80,${y(hedef) + 6}`} fill={pal.cocuk} />
      <text x="86" y={y(hedef) + 4} fill={pal.cocuk} fontSize="11" fontWeight="800">hedef</text>
      <rect x="22" y={floor + 4} width="46" height="10" rx="2" fill="#C23B3B" />
    </g>
  )
}

const SAHNE: Record<Tema, CSSProperties> = {
  doktor: {
    background: 'radial-gradient(ellipse 70% 55% at 54% 28%, rgba(232,197,71,0.20), transparent 58%), linear-gradient(180deg, #0C1730 0%, #070D18 72%, #050910 100%)',
    border: '1px solid rgba(232,197,71,0.28)',
    boxShadow: '0 28px 80px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)',
  },
  portal: {
    background: 'radial-gradient(ellipse 70% 50% at 54% 24%, rgba(201,162,39,0.22), transparent 60%), linear-gradient(180deg, #FFFDF8 0%, #F6F0E6 100%)',
    border: '1px solid rgba(201,162,39,0.28)',
    boxShadow: '0 18px 50px rgba(26,22,16,0.08)',
  },
}

export function HedefBoyManken({
  sonuc,
  tema = 'doktor',
  style,
}: {
  sonuc: HedefBoyGorsel
  tema?: Tema
  style?: CSSProperties
}) {
  const uid = useId().replace(/:/g, '')
  const pal = T[tema]
  const floor = 410
  const plotH = 292
  const maxCm = Math.max(sonuc.anneCm, sonuc.babaCm, sonuc.cocukCm, sonuc.ustCm)
  const cmMin = 140
  const cmMax = Math.max(200, Math.ceil((maxCm + 8) / 5) * 5)
  const y = (cm: number) => floor - ((cm - cmMin) / (cmMax - cmMin)) * plotH
  const cocukKind = sonuc.cinsiyet === 'erkek' ? 'erkek' : 'kiz'

  return (
    <figure style={{ margin: 0, borderRadius: 22, overflow: 'hidden', ...SAHNE[tema], ...style }} data-hedef-boy="manken">
      <svg viewBox="0 0 720 500" width="100%" role="img" aria-label="Baba, çocuk ve anne boy stüdyosu">
        <defs>
          <radialGradient id={`spot-${uid}`} cx="50%" cy="80%" r="70%">
            <stop offset="0%" stopColor={pal.spot} />
            <stop offset="100%" stopColor={pal.spot} stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`zemin-${uid}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={pal.zemin} stopOpacity="0.7" />
            <stop offset="100%" stopColor={pal.zemin} stopOpacity="0" />
          </linearGradient>
          <filter id={`parilti-${uid}`} x="-40%" y="-20%" width="180%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.2" result="b" />
            <feColorMatrix in="b" type="matrix" values="1 0.8 0.2 0 0  0.8 0.7 0.1 0 0  0.2 0.2 0.05 0 0  0 0 0 0.55 0" result="g" />
            <feMerge>
              <feMergeNode in="g" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <ellipse cx="360" cy="200" rx="210" ry="140" fill={`url(#spot-${uid})`} />
        <ellipse cx="360" cy={floor + 6} rx="250" ry="18" fill={`url(#zemin-${uid})`} />
        <path d="M70 410 Q360 428 650 410" fill="none" stroke={pal.zemin} strokeWidth="3" />

        <Olcer uid={uid} cmMin={cmMin} cmMax={cmMax} floor={floor} plotH={plotH} alt={sonuc.altCm} ust={sonuc.ustCm} hedef={sonuc.cocukCm} tema={tema} />

        {[
          { cm: sonuc.babaCm, x: 210, color: pal.baba },
          { cm: sonuc.cocukCm, x: 380, color: pal.cocuk },
          { cm: sonuc.anneCm, x: 550, color: pal.anne },
        ].map((h) => (
          <line key={h.x} x1="68" x2={h.x} y1={y(h.cm)} y2={y(h.cm)} stroke={h.color} strokeWidth="1" strokeDasharray="4 5" opacity="0.45" />
        ))}

        <Figür x={210} cm={sonuc.babaCm} cmMin={cmMin} cmMax={cmMax} floor={floor} plotH={plotH} palet={{ a: pal.baba, k: pal.babaKoyu, d: pal.babaAcik }} label="Baba" kind="baba" uid={uid} />
        <Figür x={380} cm={sonuc.cocukCm} cmMin={cmMin} cmMax={cmMax} floor={floor} plotH={plotH} palet={{ a: pal.cocuk, k: pal.cocukKoyu, d: pal.cocukAcik }} label={sonuc.cinsiyet === 'erkek' ? 'Çocuk' : 'Çocuk'} kind={cocukKind} highlight uid={uid} />
        <Figür x={550} cm={sonuc.anneCm} cmMin={cmMin} cmMax={cmMax} floor={floor} plotH={plotH} palet={{ a: pal.anne, k: pal.anneKoyu, d: pal.anneAcik }} label="Anne" kind="anne" uid={uid} />

        <g transform="translate(380 52)">
          <polygon points="0,-13 3.1,-3.4 13,-3 5.2,2.8 8,12.5 0,7 -8,12.5 -5.2,2.8 -13,-3 -3.1,-3.4" fill={pal.yildiz} />
        </g>
      </svg>
      <figcaption style={{ textAlign: 'center', padding: '4px 20px 22px', color: pal.yazi }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.18em', color: pal.cocuk, textTransform: 'uppercase' }}>Tahmini erişkin boy</div>
        <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', marginTop: 2 }}>{formatBoyCm(sonuc.cocukCm)}</div>
        <div style={{ fontSize: 13.5, color: pal.soluk, marginTop: 4 }}>
          Beklenen aralık {formatBoyCm(sonuc.altCm)} – {formatBoyCm(sonuc.ustCm)}
        </div>
      </figcaption>
    </figure>
  )
}

export function HedefBoySahneBos({ tema = 'doktor' }: { tema?: Tema }) {
  const pal = T[tema]
  return (
    <div style={{ ...SAHNE[tema], borderRadius: 22, minHeight: 420, display: 'grid', placeItems: 'center', padding: 32, textAlign: 'center' }} data-hedef-boy="bos">
      <div>
        <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.16em', color: pal.cocuk, textTransform: 'uppercase' }}>Stüdyo</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: pal.yazi, marginTop: 8, letterSpacing: '-0.03em' }}>Anne ve baba boyunu girin</div>
        <p style={{ color: pal.soluk, fontSize: 14, lineHeight: 1.55, maxWidth: 340, margin: '10px auto 0' }}>
          Solda baba, ortada çocuğun tahmini erişkin boyu, sağda anne. Boy ölçer cm cinsinden hizalar.
        </p>
      </div>
    </div>
  )
}

export function HedefBoyAileKart({
  sonuc,
  tema = 'portal',
}: {
  sonuc: HedefBoyGorsel
  tema?: Tema
}) {
  const pal = T[tema]
  return (
    <div data-hedef-boy="aile-kart">
      <div style={{ fontWeight: 800, fontSize: 16, color: pal.yazi, letterSpacing: '-0.02em' }}>
        Anne-Baba Boylarına Göre Hedef Boy
      </div>
      <div style={{ fontSize: 13, color: pal.soluk, marginTop: 4, marginBottom: 10, lineHeight: 1.45 }}>
        Baba, çocuk ve annenin tahmini erişkin boyu — aileye özel stüdyo. Tanner tahmini, tanı değil.
      </div>
      <HedefBoyManken sonuc={sonuc} tema={tema} />
      <p style={{ margin: '10px 0 0', fontSize: 12.5, color: pal.soluk, lineHeight: 1.55 }}>
        Bu bir tahmindir, garanti değildir. Beslenme, hastalık ve ergenlik zamanlaması boyu değiştirir;
        asıl izlem doktorunuzdadır.
      </p>
    </div>
  )
}

export default HedefBoyManken
