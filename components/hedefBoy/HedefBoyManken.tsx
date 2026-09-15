'use client'

/**
 * Aile stüdyosu: 3D cartoon baba – tahmini çocuk – anne, boy ölçer ile.
 * Tanner hedef boyunu ebeveyne göstermek için (cila; tanı değil).
 */
import type { CSSProperties } from 'react'
import type { HedefBoySonuc } from '@/lib/clinical/hedefBoy'
import { formatBoyCm } from '@/lib/clinical/hedefBoy'

export type HedefBoyGorsel = Pick<HedefBoySonuc, 'anneCm' | 'babaCm' | 'cocukCm' | 'altCm' | 'ustCm' | 'cinsiyet'>
type Tema = 'doktor' | 'portal'

const KARAKTER: Record<'baba' | 'anne' | 'erkek' | 'kiz', string> = {
  baba: '/hedef-boy/baba.png',
  anne: '/hedef-boy/anne.png',
  erkek: '/hedef-boy/cocuk-erkek.png',
  kiz: '/hedef-boy/cocuk-kiz.png',
}

const T: Record<Tema, {
  yazi: string; soluk: string; cocuk: string
  olcer: string; olcerCizgi: string; zemin: string
}> = {
  doktor: {
    yazi: '#F4F1E8', soluk: '#A8B4C4', cocuk: '#E8C547',
    olcer: '#E8D9C0', olcerCizgi: '#5C4A32', zemin: 'rgba(232,197,71,0.22)',
  },
  portal: {
    yazi: '#0A1628', soluk: '#6B7385', cocuk: '#C9A227',
    olcer: '#F3E6CF', olcerCizgi: '#6B5438', zemin: 'rgba(201,162,39,0.22)',
  },
}

const SAHNE: Record<Tema, CSSProperties> = {
  doktor: {
    background: 'radial-gradient(ellipse 58% 48% at 54% 22%, rgba(232,197,71,0.28), transparent 62%), linear-gradient(180deg, #15233C 0%, #0B1424 58%, #070D18 100%)',
    border: '1px solid rgba(232,197,71,0.28)',
    boxShadow: '0 28px 80px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)',
  },
  portal: {
    background: 'radial-gradient(ellipse 58% 48% at 54% 20%, rgba(201,162,39,0.24), transparent 62%), linear-gradient(180deg, #FFFDF8 0%, #F4EDE0 100%)',
    border: '1px solid rgba(201,162,39,0.28)',
    boxShadow: '0 18px 50px rgba(26,22,16,0.08)',
  },
}

const MAX_FIGUR_PX = 340

function Olcer({
  cmMin, cmMax, plotH, alt, ust, hedef, tema,
}: {
  cmMin: number
  cmMax: number
  plotH: number
  alt: number
  ust: number
  hedef: number
  tema: Tema
}) {
  const pal = T[tema]
  const y = (cm: number) => plotH - (cm / cmMax) * plotH
  const ticks: number[] = []
  for (let c = Math.ceil(cmMin / 10) * 10; c <= cmMax; c += 10) ticks.push(c)
  const yAlt = y(alt)
  const yUst = y(ust)
  return (
    <svg width="72" height={plotH + 8} viewBox={`0 0 72 ${plotH + 8}`} aria-hidden>
      <rect x="8" y="0" width="36" height={plotH} rx="8" fill={pal.olcer} stroke={pal.olcerCizgi} strokeWidth="1.2" />
      <rect x="8" y={Math.min(yAlt, yUst)} width="36" height={Math.max(8, Math.abs(yAlt - yUst))} fill={pal.cocuk} opacity="0.32" />
      {ticks.map((c) => (
        <g key={c}>
          <line x1="8" x2="36" y1={y(c)} y2={y(c)} stroke={pal.olcerCizgi} strokeWidth="1.3" />
          <text x="50" y={y(c) + 4} fill={pal.soluk} fontSize="10" fontWeight="700">{c}</text>
        </g>
      ))}
      <line x1="8" x2="48" y1={y(hedef)} y2={y(hedef)} stroke={pal.cocuk} strokeWidth="2.4" />
      <polygon points={`48,${y(hedef)} 60,${y(hedef) - 6} 60,${y(hedef) + 6}`} fill={pal.cocuk} />
    </svg>
  )
}

function Figur({
  src, cm, cmMax, label, accent, highlight, soluk,
}: {
  src: string
  cm: number
  cmMax: number
  label: string
  accent: string
  highlight?: boolean
  soluk: string
}) {
  const h = Math.max(120, (cm / cmMax) * MAX_FIGUR_PX)
  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '32%', minWidth: 90 }}>
      {highlight && (
        <div aria-hidden style={{
          position: 'absolute', bottom: 52, width: '78%', height: h * 0.72,
          background: 'radial-gradient(ellipse at 50% 70%, rgba(232,197,71,0.45), transparent 70%)',
          filter: 'blur(6px)', pointerEvents: 'none',
        }} />
      )}
      <img
        src={src}
        alt={label}
        style={{
          height: h,
          width: 'auto',
          maxWidth: '100%',
          objectFit: 'contain',
          objectPosition: 'bottom',
          filter: highlight
            ? 'drop-shadow(0 18px 18px rgba(0,0,0,0.35)) drop-shadow(0 0 18px rgba(232,197,71,0.35))'
            : 'drop-shadow(0 16px 14px rgba(0,0,0,0.32))',
          position: 'relative',
        }}
      />
      <div style={{ marginTop: 8, textAlign: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.04em', color: accent }}>{label}</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: soluk, marginTop: 1 }}>{Math.round(cm)} cm</div>
      </div>
    </div>
  )
}

export function HedefBoyManken({
  sonuc,
  tema = 'doktor',
  style,
  ornek = false,
}: {
  sonuc: HedefBoyGorsel
  tema?: Tema
  style?: CSSProperties
  ornek?: boolean
}) {
  const pal = T[tema]
  const maxCm = Math.max(sonuc.anneCm, sonuc.babaCm, sonuc.cocukCm, sonuc.ustCm)
  const cmMax = Math.max(190, Math.ceil((maxCm + 6) / 5) * 5)
  const cmMin = 140
  const cocukSrc = sonuc.cinsiyet === 'kiz' ? KARAKTER.kiz : KARAKTER.erkek
  const cocukLabel = sonuc.cinsiyet === 'kiz' ? 'Kız' : 'Erkek'

  return (
    <figure style={{ margin: 0, borderRadius: 22, overflow: 'hidden', ...SAHNE[tema], ...style, position: 'relative' }} data-hedef-boy="manken">
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, padding: '28px 16px 8px 8px', minHeight: 420 }}>
        <div style={{ flexShrink: 0, paddingBottom: 52 }}>
          <Olcer cmMin={cmMin} cmMax={cmMax} plotH={MAX_FIGUR_PX} alt={sonuc.altCm} ust={sonuc.ustCm} hedef={sonuc.cocukCm} tema={tema} />
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', minWidth: 0 }}>
          <Figur src={KARAKTER.baba} cm={sonuc.babaCm} cmMax={cmMax} label="Baba" accent="#8EC8EA" soluk={pal.soluk} />
          <Figur src={cocukSrc} cm={sonuc.cocukCm} cmMax={cmMax} label={cocukLabel} accent={pal.cocuk} soluk={pal.soluk} highlight />
          <Figur src={KARAKTER.anne} cm={sonuc.anneCm} cmMax={cmMax} label="Anne" accent="#E7A4B0" soluk={pal.soluk} />
        </div>
      </div>
      <div aria-hidden style={{
        height: 18, margin: '0 40px 4px',
        background: `radial-gradient(ellipse at 50% 0%, ${pal.zemin}, transparent 70%)`,
        borderRadius: '50%',
      }} />
      <figcaption style={{ textAlign: 'center', padding: '2px 20px 22px', color: pal.yazi }}>
        {ornek ? (
          <>
            <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.16em', color: pal.cocuk, textTransform: 'uppercase' }}>Stüdyo</div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', marginTop: 6 }}>Anne ve baba boyunu girin</div>
            <div style={{ fontSize: 13.5, color: pal.soluk, marginTop: 6 }}>Solda baba, ortada tahmini erişkin boy, sağda anne.</div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.18em', color: pal.cocuk, textTransform: 'uppercase' }}>Tahmini erişkin boy</div>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', marginTop: 2 }}>{formatBoyCm(sonuc.cocukCm)}</div>
            <div style={{ fontSize: 13.5, color: pal.soluk, marginTop: 4 }}>
              Beklenen aralık {formatBoyCm(sonuc.altCm)} – {formatBoyCm(sonuc.ustCm)}
            </div>
          </>
        )}
      </figcaption>
    </figure>
  )
}

export function HedefBoySahneBos({ tema = 'doktor' }: { tema?: Tema }) {
  return (
    <HedefBoyManken
      tema={tema}
      ornek
      sonuc={{ anneCm: 168, babaCm: 180, cocukCm: 174, altCm: 165.5, ustCm: 182.5, cinsiyet: 'erkek' }}
    />
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
