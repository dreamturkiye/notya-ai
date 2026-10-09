/**
 * NOTYA-ULKE-PORTAL-01 — the patient portal's fixed numbers and names. Client-safe: plain values, no imports.
 *
 * These are the KIT's (the same in every country): they are security limits, not local custom. What a country
 * decides is in its pack (`uygulama.portal`): how long a link stays valid.
 */

/** A PIN is this many digits. */
export const PIN_HANE = 6
/** Wrong PINs a link takes before it locks for good. The doctor then gives a new link. */
export const PIN_DENEME_AZAMI = 5
/** Two PIN tries on one link closer together than this many seconds: the second is not looked at and not counted. */
export const PIN_DENEME_ARALIGI_SN = 2
/** A signed-in portal session ends after this many minutes, and never outlives its link. */
export const PORTAL_OTURUM_DK = 30

/** The page a portal link opens. The link's token rides in the FRAGMENT (#…): it is never sent to a server as part of an address. */
export const PORTAL_SAYFASI = '/portal'
/** Routes a patient's browser calls. The session cookie is sent to this path and to nothing else. */
export const PORTAL_API = '/api/ulke/portal'
/** Routes a DOCTOR's session calls to manage a patient's portal. Deliberately not under PORTAL_API. */
export const HEKIM_PORTAL_API = '/api/ulke/hasta-portali'
/** NOTYA-ULKE-INTAKE-01 — the intake form: the route a DOCTOR's session calls, and the one a PATIENT's page calls (under PORTAL_API, so the portal cookie reaches it). */
export const HEKIM_FORM_API = '/api/ulke/hasta-formu'
export const PORTAL_FORM_API = '/api/ulke/portal/form'
export const PORTAL_CEREZI = 'notya_portal'
/** A request that changes something must carry this header: a page of another site cannot send it. */
export const PORTAL_ISTEK_BASLIGI = 'x-notya-portal'
/**
 * Which link the page is open for: the SHA-256 of the link's token, hex. A session answers only the page of its own
 * link — on a shared phone, opening a second patient's link never shows the first patient's page. The value cannot
 * sign anybody in (signing in takes the token itself and the PIN).
 */
export const PORTAL_BAGLANTI_BASLIGI = 'x-notya-portal-baglanti'
export const BAGLANTI_OZETI_BICIMI = /^[0-9a-f]{64}$/

/** An appointment request names at most this many preferred days, among the next ISTEK_GUN_UFKU days. */
export const ISTEK_GUN_AZAMI = 3
export const ISTEK_GUN_UFKU = 21
export const ISTEK_NEDEN_AZAMI = 200
/** Longest summary for the patient the application keeps. */
export const OZET_AZAMI = 6000

/** 256 random bits, base64url: what a link's token and a session's key look like. */
export const ANAHTAR_BICIMI = /^[A-Za-z0-9_-]{43}$/
export const pinBicimiGecerli = (ham: unknown): ham is string => typeof ham === 'string' && new RegExp(`^\\d{${PIN_HANE}}$`).test(ham)
