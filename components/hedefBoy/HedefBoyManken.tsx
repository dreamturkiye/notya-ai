'use client'

/**
 * Aile stüdyosu: 3D cartoon baba – tahmini çocuk – anne, boy ölçer ile.
 * Tanner hedef boyunu ebeveyne göstermek için (cila; tanı değil).
 */
import { useLayoutEffect, useRef, useState, type CSSProperties, type Ref } from 'react'
import type { HedefBoySonuc } from '@/lib/clinical/hedefBoy'
import { formatBoyCm, cinsiyetHedefBoy, hesaplaHedefBoy } from '@/lib/clinical/hedefBoy'

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
    yazi: '#F4F1E8', soluk: '#C5D0DC', cocuk: '#E8C547',
    olcer: '#F3E6CF', olcerCizgi: '#3D2C18', zemin: 'rgba(232,197,71,0.22)',
  },
  portal: {
    yazi: '#0A1628', soluk: '#5C6578', cocuk: '#C9A227',
    olcer: '#F6EBDA', olcerCizgi: '#3D2C18', zemin: 'rgba(201,162,39,0.22)',
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

const CM_TICK = 10
const PX_PER_TICK = 34

function plotHFor(cmMax: number) {
  return Math.max(520, Math.round((cmMax / CM_TICK) * PX_PER_TICK))
}

/** PNG width / height. The studio lays figures out at this aspect. */
const FIGUR_ORAN = { baba: 390 / 1083, anne: 331 / 1100, erkek: 358 / 1103, kiz: 339 / 1113 }

/** Shrink the plot so ruler + three figures fit the column. Wide screens keep the desktop plot. */
function plotSigdir(yer: number, cmMax: number, baba: number, cocuk: number, anne: number, kiz: boolean) {
  const masa = plotHFor(cmMax)
  if (yer <= 0) return { plotH: masa, cetvel: 150 }
  const cocukOran = kiz ? FIGUR_ORAN.kiz : FIGUR_ORAN.erkek
  const katsayi = (baba / cmMax) * FIGUR_ORAN.baba + (cocuk / cmMax) * cocukOran + (anne / cmMax) * FIGUR_ORAN.anne
  const cetvel = yer < 560 ? 108 : 150
  const sigan = Math.floor((yer - cetvel - 28) / katsayi)
  return { plotH: Math.min(masa, Math.max(160, sigan)), cetvel }
}

function useKolonGenisligi(): [Ref<HTMLElement>, number] {
  const ref = useRef<HTMLElement>(null)
  const [gen, setGen] = useState(0)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const oku = () => {
      const w = el.clientWidth
      setGen((prev) => (Math.abs(prev - w) < 2 ? prev : w))
    }
    oku()
    const ro = new ResizeObserver(oku)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, gen]
}

/** Scale from the floor. Mapping 140→0px made a 165 cm mother look like a child. */
function yCm(cm: number, cmMax: number, plotH: number) {
  return plotH * (1 - cm / cmMax)
}

function hCm(cm: number, cmMax: number, plotH: number) {
  return plotH * (cm / cmMax)
}

function Olcer({
  cmMin, cmMax, plotH, alt, ust, hedef, tema, genislik = 150,
}: {
  cmMin: number
  cmMax: number
  plotH: number
  alt: number
  ust: number
  hedef: number
  tema: Tema
  genislik?: number
}) {
  const pal = T[tema]
  const pad = 24
  const y = (cm: number) => pad + yCm(cm, cmMax, plotH)
  const majors: number[] = []
  const minors: number[] = []
  for (let c = Math.ceil(cmMin / 5) * 5; c <= cmMax; c += 5) {
    if (c % 10 === 0) majors.push(c)
    else minors.push(c)
  }
  const yAlt = y(alt)
  const yUst = y(ust)
  const yHedef = y(hedef)
  const sayi = tema === 'doktor' ? '#F4F1E8' : '#2A1C10'
  const genis = genislik >= 140
  const barX = genis ? 10 : 6
  const barW = genis ? 48 : 30
  const tickKisa = barX + (genis ? 18 : 12)
  const tickUzun = barX + barW
  const sayiX = tickUzun + (genis ? 6 : 4)
  const sayiBoy = genis ? 16 : 12
  const W = genislik
  return (
    <svg width={W} height={plotH + pad + 8} viewBox={`0 0 ${W} ${plotH + pad + 8}`} aria-hidden>
      <text x={genis ? 36 : barX + barW / 2} y="16" textAnchor="middle" fill={pal.cocuk} fontSize="13" fontWeight="800" letterSpacing="0.14em">cm</text>
      <rect x={barX} y={pad} width={barW} height={plotH} rx="10" fill={pal.olcer} stroke={pal.olcerCizgi} strokeWidth="1.6" />
      <rect
        x={barX}
        y={Math.min(yAlt, yUst)}
        width={barW}
        height={Math.max(10, Math.abs(yAlt - yUst))}
        fill={pal.cocuk}
        opacity="0.38"
      />
      {minors.map((c) => (
        <line key={c} x1={barX} x2={tickKisa} y1={y(c)} y2={y(c)} stroke={pal.olcerCizgi} strokeWidth="1.2" opacity="0.4" />
      ))}
      {majors.map((c) => (
        <g key={c}>
          <line x1={barX} x2={tickUzun} y1={y(c)} y2={y(c)} stroke={pal.olcerCizgi} strokeWidth="2" />
          <text x={sayiX} y={y(c) + (genis ? 6 : 4)} fill={sayi} fontSize={sayiBoy} fontWeight="800">{c}</text>
        </g>
      ))}
      <line x1={barX} x2={tickUzun} y1={yHedef} y2={yHedef} stroke={pal.cocuk} strokeWidth="3.2" />
      <polygon points={`${tickUzun},${yHedef} ${tickUzun + 14},${yHedef - 7} ${tickUzun + 14},${yHedef + 7}`} fill={pal.cocuk} />
      {genis && <text x="100" y={yHedef + 5} fill={pal.cocuk} fontSize="12" fontWeight="800">hedef</text>}
    </svg>
  )
}

function Figur({
  src, cm, cmMax, plotH, label, accent, highlight, soluk,
}: {
  src: string
  cm: number
  cmMax: number
  plotH: number
  label: string
  accent: string
  highlight?: boolean
  soluk: string
}) {
  const h = hCm(cm, cmMax, plotH)
  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '0 0 auto', minWidth: 'auto', overflow: 'visible' }}>
      {highlight && (
        <div aria-hidden style={{
          position: 'absolute', bottom: 52, left: '50%', transform: 'translateX(-50%)', width: '78%', height: h * 0.55,
          background: 'radial-gradient(ellipse at 50% 70%, rgba(232,197,71,0.4), transparent 70%)',
          filter: 'blur(6px)', pointerEvents: 'none',
        }} />
      )}
      <img
        key={src}
        src={src}
        alt={label}
        className="hedef-boy-figur"
        style={{
          ['--hedef-boy-h' as string]: `${h}px`,
          height: h,
          width: 'auto',
          maxWidth: 'none',
          maxHeight: 'none',
          flexShrink: 0,
          objectFit: 'contain',
          objectPosition: 'bottom',
          filter: highlight
            ? 'drop-shadow(0 18px 18px rgba(0,0,0,0.35)) drop-shadow(0 0 12px rgba(232,197,71,0.28))'
            : 'drop-shadow(0 16px 14px rgba(0,0,0,0.32))',
          position: 'relative',
        }}
      />
      <div style={{ marginTop: 8, textAlign: 'center' }}>
        <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: '0.04em', color: accent }}>{label}</div>
        <div style={{ fontSize: 15, fontWeight: 800, color: soluk, marginTop: 1 }}>{Math.round(cm)} cm</div>
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
  const cmMin = 140
  const cmMax = Math.max(190, Math.ceil((maxCm + 8) / 5) * 5)
  const kiz = sonuc.cinsiyet === 'kiz'
  const [kutuRef, kolon] = useKolonGenisligi()
  const { plotH, cetvel } = plotSigdir(kolon, cmMax, sonuc.babaCm, sonuc.cocukCm, sonuc.anneCm, kiz)
  const cocukSrc = kiz ? KARAKTER.kiz : KARAKTER.erkek
  const cocukLabel = kiz ? 'Kız' : 'Erkek'

  return (
    <figure ref={kutuRef} style={{ margin: 0, borderRadius: 22, overflow: 'hidden', ...SAHNE[tema], ...style, position: 'relative', width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }} data-hedef-boy="manken" data-cinsiyet={sonuc.cinsiyet}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, padding: '22px 14px 8px 4px', minHeight: plotH + 88, width: '100%', boxSizing: 'border-box' }}>
        <div style={{ flexShrink: 0, paddingBottom: 54 }}>
          <Olcer cmMin={cmMin} cmMax={cmMax} plotH={plotH} alt={sonuc.altCm} ust={sonuc.ustCm} hedef={sonuc.cocukCm} tema={tema} genislik={cetvel} />
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', minWidth: 0, overflow: 'visible' }}>
          <Figur src={KARAKTER.baba} cm={sonuc.babaCm} cmMax={cmMax} plotH={plotH} label="Baba" accent="#8EC8EA" soluk={pal.soluk} />
          <Figur src={cocukSrc} cm={sonuc.cocukCm} cmMax={cmMax} plotH={plotH} label={cocukLabel} accent={pal.cocuk} soluk={pal.soluk} highlight />
          <Figur src={KARAKTER.anne} cm={sonuc.anneCm} cmMax={cmMax} plotH={plotH} label="Anne" accent="#E7A4B0" soluk={pal.soluk} />
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
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.18em', color: pal.cocuk, textTransform: 'uppercase' }}>
              Tahmini erişkin boy · {kiz ? 'Kız' : 'Erkek'}
            </div>
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

export function HedefBoySahneBos({
  tema = 'doktor',
  cinsiyet = 'Erkek',
}: {
  tema?: Tema
  cinsiyet?: string
}) {
  const c = cinsiyetHedefBoy(cinsiyet) || 'erkek'
  const ornek = hesaplaHedefBoy({ anneBoy: 168, babaBoy: 180, cinsiyet: c })
  const sonuc: HedefBoyGorsel = ornek.ok
    ? ornek.sonuc
    : { anneCm: 168, babaCm: 180, cocukCm: c === 'kiz' ? 167.5 : 180.5, altCm: 159, ustCm: 176, cinsiyet: c }
  return <HedefBoyManken tema={tema} ornek sonuc={sonuc} />
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
