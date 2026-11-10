/** ZIYARET-SAYACI-01 — constants shared by the beacon (browser), the API route and the founder console. Same file in every build. */

/** The beacon's API path (a country build adds its base path in front, e.g. /uzbek). */
export const ZIYARET_YOLU = '/api/internal/visit'

/** Set to '1' by the founder console in the founder's own browser: that browser's visits are not counted. A constant flag, not an identifier. */
export const ZIYARET_HARIC_ANAHTARI = 'notya-ziyaret-haric'
