'use client'
/**
 * SAGLIGIM-GORUNUM-V3 (Kaan, 2026-11-25: "Hasta portalının background ve görünümünü çok daha güzel yap … come up with
 * your own background image") — the illustrated morning band behind the Bugün greeting. Core for all 30 branşlar + 10
 * Özel Branşlar and every country (one image set, no branş fork; gorunum-paritesi-ulke): it carries no words — the
 * greeting arrives as children.
 *
 * Image: our own drawing (public/portal/gorseller/KAYNAK.md) — a windowsill at sunrise whose sun wears the day rings.
 * Decorative (alt="", aria-hidden). Performance (performans-butcesi-koruma): AVIF → WebP, three widths, explicit size
 * (no layout shift: the band's height never depends on the image), never fetched under prefers-reduced-data or
 * Save-Data (plain band instead). Motion: one soft fade-in, none under prefers-reduced-motion (CSS).
 */
import { useSyncExternalStore, type ReactNode } from 'react'
import { yerelDakika } from '@/lib/saglikEvi/zaman'

const KOK = '/portal/gorseller'
const GENISLIK = [480, 960, 1440] as const
const set = (tur: 'avif' | 'webp') => GENISLIK.map((w) => `${KOK}/sabah-${w}.${tur} ${w}w`).join(', ')
/** Rendered art width: phone ≈ 300 CSS px (band 200 px tall, 3:2 art); wide screens ≈ 390 px. */
const BOYUTLAR = '(min-width: 720px) 390px, 300px'
/** A 1×1 transparent GIF: the reduced-data source wins before AVIF/WebP, so nothing heavy is fetched. */
const BOS = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

type Baglanti = { saveData?: boolean }
const veriTasarrufu = () => {
  try { return !!(navigator as Navigator & { connection?: Baglanti }).connection?.saveData } catch { return false }
}
const hicAbone = () => () => undefined

/** true on the client unless Save-Data is on; false on the server (the band draws plain until the client knows). */
export function useGorselIzni(): boolean {
  return useSyncExternalStore(hicAbone, () => !veriTasarrufu(), () => false)
}

const saatAbone = (cb: () => void) => {
  const t = setInterval(cb, 30_000)
  const g = () => { if (document.visibilityState === 'visible') cb() }
  document.addEventListener('visibilitychange', g)
  return () => { clearInterval(t); document.removeEventListener('visibilitychange', g) }
}

/**
 * The device's local minute of the day for the greeting (Günaydın / İyi günler / …): null on the server and during
 * hydration (neutral greeting, identical markup), the real local minute on the client, refreshed every 30 s and when
 * the tab comes back. Dose schedules keep their Türkiye-time rules (lib/saglikEvi/zaman.ts).
 */
export function useCihazDakikasi(): number | null {
  return useSyncExternalStore(saatAbone, () => yerelDakika(), () => null)
}

export function SaglikKahramani({ children, sag }: { children: ReactNode; sag?: ReactNode }) {
  const gorsel = useGorselIzni()
  return (
    <header className="sgk" data-testid="saglik-kahramani">
      <div className="sgk-ic">
        {gorsel ? (
          <div className="sgk-gorsel" aria-hidden>
            <picture>
              <source media="(prefers-reduced-data: reduce)" srcSet={BOS} />
              <source type="image/avif" srcSet={set('avif')} sizes={BOYUTLAR} />
              <source type="image/webp" srcSet={set('webp')} sizes={BOYUTLAR} />
              {/* eslint-disable-next-line @next/next/no-img-element -- art-directed <picture> with AVIF/WebP + reduced-data source */}
              <img src={`${KOK}/sabah-960.webp`} width={720} height={480} alt="" decoding="async" draggable={false} />
            </picture>
          </div>
        ) : null}
        <div className="sgk-metin">{children}</div>
        {sag ? <div className="sgk-sag">{sag}</div> : null}
      </div>
    </header>
  )
}

/** Empty-state spot (a seedling under the day ring) — decorative, lazy, 0.6 kB. */
export function FideGorseli({ boyut = 64 }: { boyut?: number }) {
  // eslint-disable-next-line @next/next/no-img-element -- tiny static SVG
  return <img className="sgk-fide" src={`${KOK}/fide.svg`} width={boyut} height={boyut} alt="" aria-hidden loading="lazy" decoding="async" />
}
