/**
 * NOTYA-ULKE-PORTAL-01 — the patient's page, for every country that switches `hastaPortali` on. The kit owns the
 * screen; a country brings what it says (countries/active/arayuz → portalMetinleri). Served by app/portal/page.ulke.tsx.
 * The stylesheet is the application's (same look), imported here so that it loads with this page.
 */
import '../uygulama/uygulama.css'

export { default as PortalSayfasi } from './PortalSayfasi'
