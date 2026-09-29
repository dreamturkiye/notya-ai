/**
 * Home-screen launch of the installed iPhone/Android app.
 * Those installs used to open /asistan (manifest start_url). New installs open Ana Sayfa.
 * Already-installed phones keep the old start URL until the icon is added again, so a cold
 * open of /asistan — empty referrer, first navigation of the session — goes to Ana Sayfa.
 * Opening Asistan from the menu has a referrer and stays put.
 *
 * Live (Kaan, 2026-09-29): painting /asistan then replace() showed Asistan for ~0.5s with
 * Ana Sayfa stacking on top — and the greeting could start under the home screen.
 */

export type PwaIkonOrtam = {
  standalone: boolean
  sessionYeni: boolean
  referrerPath: string | null
}

export function pwaIkonundanAsistanKarari(o: PwaIkonOrtam): boolean {
  if (!o.standalone || !o.sessionYeni) return false
  if (!o.referrerPath) return true
  return o.referrerPath === '/asistan' || o.referrerPath === '/asistan/'
}

export function pwaIkonundanAsistanMi(): boolean {
  if (typeof window === 'undefined') return false
  const nav = window.navigator as Navigator & { standalone?: boolean }
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    nav.standalone === true
  if (!standalone) return false
  let ilk = false
  try {
    ilk = sessionStorage.getItem('notya_pwa_oturum') !== '1'
    sessionStorage.setItem('notya_pwa_oturum', '1')
  } catch {
    return false
  }
  const referans = document.referrer
  let referrerPath: string | null = null
  if (referans) {
    try {
      referrerPath = new URL(referans).pathname
    } catch {
      referrerPath = null
    }
  }
  return pwaIkonundanAsistanKarari({ standalone: true, sessionYeni: ilk, referrerPath })
}
