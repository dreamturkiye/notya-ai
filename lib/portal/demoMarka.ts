/**
 * HASTA-ALANI-MARKA — the internal demo's doctor brands (/portal/demo?marka=…), all fictional, no PHI:
 *   (none) / monogram  the demo doctor with no logo and no photo → monogram (the honest default for live demos)
 *   logo               the same doctor with a sample practice logo ("Moda Dahiliye" — fictional, public/portal/demo-marka)
 *   foto               a fictional doctor persona with a profile photo (public/portal/demo-marka/hekim-foto.jpg)
 *   klinik             a fictional Notya Klinik clinic ("Kalamış Sağlık Merkezi") with its logo; the treating doctor under it
 * The doctor card on Bugün follows the same variant (demoHekim), so header and card never disagree.
 */
import type { PortalHekim } from './types'
import { SAGLIGIM_DEMO } from './demoData'
import { markaCoz, type PortalMarka } from './marka'

export type DemoMarkaTuru = 'monogram' | 'logo' | 'foto' | 'klinik'

export function demoMarkaTuru(x: string | null | undefined): DemoMarkaTuru {
  return x === 'logo' || x === 'foto' || x === 'klinik' ? x : 'monogram'
}

const H = SAGLIGIM_DEMO.hekim

export function demoHekim(tur: DemoMarkaTuru): PortalHekim {
  if (tur === 'logo') return { ...H, klinik: 'Moda Dahiliye Muayenehanesi' }
  if (tur === 'foto') return { ...H, ad: 'Prof. Dr. Deniz Yılmaz', klinik: 'Yılmaz Dahiliye', avatarUrl: '/portal/demo-marka/hekim-foto.jpg' }
  if (tur === 'klinik') return { ...H, klinik: 'Kalamış Sağlık Merkezi' }
  return H
}

export function demoMarka(tur: DemoMarkaTuru): PortalMarka {
  const h = demoHekim(tur)
  if (tur === 'logo') return markaCoz({ hekimAdi: h.ad, brans: h.brans, klinikAdi: h.klinik, logoUrl: '/portal/demo-marka/moda-dahiliye.png', vurgu: 'lacivert' })
  if (tur === 'foto') return markaCoz({ hekimAdi: h.ad, brans: h.brans, klinikAdi: h.klinik, fotoUrl: h.avatarUrl, vurgu: 'petrol' })
  if (tur === 'klinik') return markaCoz({ hekimAdi: h.ad, brans: h.brans, notyaKlinik: { ad: 'Kalamış Sağlık Merkezi', logoUrl: '/portal/demo-marka/kalamis-saglik.png' }, vurgu: 'bordo' })
  return markaCoz({ hekimAdi: h.ad, brans: h.brans, klinikAdi: h.klinik, vurgu: 'cam' })
}

const ANAHTAR = 'sg-demo-marka'
/** Client only (call in an effect): ?marka=… wins and is remembered for the demo session, so in-demo links keep it. */
export function demoMarkaSecimiOku(): DemoMarkaTuru {
  try {
    const q = new URLSearchParams(window.location.search).get('marka')
    if (q) { window.sessionStorage.setItem(ANAHTAR, demoMarkaTuru(q)); return demoMarkaTuru(q) }
    return demoMarkaTuru(window.sessionStorage.getItem(ANAHTAR))
  } catch {
    return 'monogram'
  }
}
