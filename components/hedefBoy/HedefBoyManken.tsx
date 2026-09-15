'use client'

/**
 * Anne / çocuk / baba silüetleri — Tanner hedef boyunu aileye göstermek için.
 * Ölçek boya göre; çocuk ortada, tahmini erişkin boyu.
 */
import { useId, type CSSProperties } from 'react'
import type { HedefBoySonuc } from '@/lib/clinical/hedefBoy'
import { formatBoyCm } from '@/lib/clinical/hedefBoy'

export type HedefBoyGorsel = Pick<HedefBoySonuc, 'anneCm' | 'babaCm' | 'cocukCm' | 'altCm' | 'ustCm' | 'cinsiyet'>

type Tema = 'doktor' | 'portal'

const TEMALAR: Record<Tema, {
  baba: string; anne: string; cocuk: string; zemin: string; yazi: string; soluk: string; yildiz: string
}> = {
  doktor: {
    baba: '#38BDF8',
    anne: '#F472B6',
    cocuk: '#FBBF24',
    zemin: 'rgba(255,255,255,0.12)',
    yazi: '#EDF1F7',
    soluk: '#8FA0B5',
    yildiz: '#FDE68A',
  },
  portal: {
    baba: '#1A6B7A',
    anne: '#C2603F',
    cocuk: '#C9A227',
    zemin: 'var(--sg-line, #E6EAF0)',
    yazi: 'var(--sg-ink, #0A1628)',
    soluk: 'var(--sg-muted, #6B7385)',
    yildiz: '#E8C547',
  },
}

function ErkekGovde({ fill }: { fill: string }) {
  return (
    <g>
      <ellipse cx="0" cy="-78" rx="14" ry="16" fill={fill} />
      <rect x="-8" y="-66" width="16" height="8" rx="3" fill={fill} opacity="0.85" />
      <path d="M-22 -54 L22 -54 L16 8 L-16 8 Z" fill={fill} />
      <path d="M-20 -48 L-32 -8 L-24 -8 L-12 -50 Z" fill={fill} />
      <path d="M20 -48 L32 -8 L24 -8 L12 -50 Z" fill={fill} />
      <path d="M-14 8 L-18 92 L-6 92 L-4 8 Z" fill={fill} />
      <path d="M14 8 L18 92 L6 92 L4 8 Z" fill={fill} />
    </g>
  )
}

function KizGovde({ fill }: { fill: string }) {
  return (
    <g>
      <ellipse cx="0" cy="-82" rx="18" ry="20" fill={fill} opacity="0.55" />
      <ellipse cx="0" cy="-76" rx="13" ry="15" fill={fill} />
      <path d="M-16 -56 Q-22 -20 0 10 Q22 -20 16 -56 Z" fill={fill} />
      <path d="M-14 -48 L-28 -10 L-20 -8 L-6 -50 Z" fill={fill} />
      <path d="M14 -48 L28 -10 L20 -8 L6 -50 Z" fill={fill} />
      <path d="M-18 8 Q0 28 18 8 L14 92 L6 92 L4 22 L-4 22 L-6 92 L-14 92 Z" fill={fill} />
    </g>
  )
}

function Figür({
  x, cm, maxCm, fill, label, boyYazi, kind, highlight,
}: {
  x: number
  cm: number
  maxCm: number
  fill: string
  label: string
  boyYazi: string
  kind: 'erkek' | 'kiz'
  highlight?: boolean
}) {
  const scale = (cm / maxCm) * 0.95
  return (
    <g transform={`translate(${x} 252)`}>
      {highlight && (
        <ellipse cx="0" cy="6" rx="48" ry="10" fill={fill} opacity="0.22" />
      )}
      <g transform={`scale(${scale}) translate(0 -92)`}>
        {kind === 'erkek' ? <ErkekGovde fill={fill} /> : <KizGovde fill={fill} />}
      </g>
      <text textAnchor="middle" y="24" fill={fill} fontSize="13" fontWeight="800">{label}</text>
      <text textAnchor="middle" y="42" fill={fill} fontSize="12" fontWeight="600">{boyYazi}</text>
    </g>
  )
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
  const zeminId = `hedefZemin-${uid}`
  const t = TEMALAR[tema]
  const maxCm = Math.max(sonuc.anneCm, sonuc.babaCm, sonuc.cocukCm, 150)
  const cocukKind = sonuc.cinsiyet === 'erkek' ? 'erkek' : 'kiz'
  const kutu: CSSProperties = tema === 'doktor'
    ? {
        background: 'linear-gradient(180deg, rgba(15,155,142,0.12), rgba(255,255,255,0.03))',
        border: '1px solid rgba(251,191,36,0.28)',
        borderRadius: 16,
        padding: '8px 8px 4px',
      }
    : { background: 'transparent' }

  return (
    <figure style={{ margin: 0, ...kutu, ...style }} data-hedef-boy="manken">
      <svg viewBox="0 0 480 360" width="100%" role="img" aria-label="Anne, çocuk ve baba boy karşılaştırması">
        <defs>
          <linearGradient id={zeminId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={t.zemin} stopOpacity="0" />
            <stop offset="100%" stopColor={t.zemin} stopOpacity="1" />
          </linearGradient>
        </defs>
        <rect x="24" y="246" width="432" height="12" rx="6" fill={`url(#${zeminId})`} />
        <line x1="40" x2="440" y1="252" y2="252" stroke={t.zemin} strokeWidth="2" />

        <Figür x={88} cm={sonuc.babaCm} maxCm={maxCm} fill={t.baba} label="Baba" boyYazi={`${Math.round(sonuc.babaCm)} cm`} kind="erkek" />
        <Figür
          x={240}
          cm={sonuc.cocukCm}
          maxCm={maxCm}
          fill={t.cocuk}
          label={sonuc.cinsiyet === 'erkek' ? 'Çocuk (E)' : 'Çocuk (K)'}
          boyYazi={`${Math.round(sonuc.cocukCm)} cm`}
          kind={cocukKind}
          highlight
        />
        <g transform="translate(240 48)">
          <polygon points="0,-10 2.4,-2.4 10,-2.2 4,2.4 6.2,10 0,5.4 -6.2,10 -4,2.4 -10,-2.2 -2.4,-2.4" fill={t.yildiz} />
        </g>
        <Figür x={392} cm={sonuc.anneCm} maxCm={maxCm} fill={t.anne} label="Anne" boyYazi={`${Math.round(sonuc.anneCm)} cm`} kind="kiz" />
      </svg>
      <figcaption style={{ textAlign: 'center', padding: '0 12px 12px', color: t.yazi }}>
        <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.02em' }}>
          Tahmini erişkin boy {formatBoyCm(sonuc.cocukCm)}
        </div>
        <div style={{ fontSize: 13, color: t.soluk, marginTop: 4 }}>
          Beklenen aralık {formatBoyCm(sonuc.altCm)} – {formatBoyCm(sonuc.ustCm)}
        </div>
      </figcaption>
    </figure>
  )
}

export function HedefBoyAileKart({
  sonuc,
  tema = 'portal',
}: {
  sonuc: HedefBoyGorsel
  tema?: Tema
}) {
  const t = TEMALAR[tema]
  return (
    <div data-hedef-boy="aile-kart">
      <div style={{ fontWeight: 800, fontSize: 16, color: t.yazi, letterSpacing: '-0.02em' }}>
        Anne-Baba Boylarına Göre Hedef Boy
      </div>
      <div style={{ fontSize: 13, color: t.soluk, marginTop: 4, marginBottom: 8, lineHeight: 1.45 }}>
        Baba, çocuk ve annenin tahmini erişkin boyu yan yana. Tanner formülü — tanı değil, aileye hoş bir bakış.
      </div>
      <HedefBoyManken sonuc={sonuc} tema={tema} />
      <p style={{ margin: '4px 0 0', fontSize: 12.5, color: t.soluk, lineHeight: 1.55 }}>
        Bu bir tahmindir, garanti değildir. Beslenme, hastalık ve ergenlik zamanlaması boyu değiştirir;
        asıl izlem doktorunuzdadır.
      </p>
    </div>
  )
}

export default HedefBoyManken
