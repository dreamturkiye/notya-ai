/**
 * Home-screen launch of the installed iPhone/Android app.
 * Those installs used to open /asistan (manifest start_url). New installs open Ana Sayfa.
 * Already-installed phones keep the old start URL until the icon is added again, so a cold
 * open of /asistan — empty referrer, first navigation of the session — goes to Ana Sayfa.
 * Opening Asistan from the menu has a referrer and stays put.
 */
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
  if (!ilk) return false
  const referans = document.referrer
  if (!referans) return true
  try {
    const yol = new URL(referans).pathname
    return yol === '/asistan' || yol === '/asistan/'
  } catch {
    return false
  }
}
