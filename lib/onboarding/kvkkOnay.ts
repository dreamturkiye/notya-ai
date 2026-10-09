/**
 * NOTYA-ONBOARDING-01 (Kaan, 2026-10-09) — KVKK açık rızası onboarding'de: yalnız kaydı olmayan hesaba sorulur.
 *
 * Rıza bugüne kadar yalnız herkese açık kayıt sayfasında (app/kayit/page.tsx) alınıyordu; yönetici tarafından
 * açılan hesaplar o sayfadan hiç geçmiyor. Karar SUNUCUDA verilir (tarayıcıdan gelen "gerekli değil" bayrağına
 * güvenilmez) ve hekimin işaretlemediği rıza ASLA damgalanmaz.
 *
 * Metin, bağlantı ve sürüm /kayit ile birebir aynıdır (components/onboarding/KvkkOnayKutusu.tsx); yeni hukuki
 * metin yazılmadı. /kayit dosyasına dokunulmadı — iki yerin ayrışmadığını lib/onboarding/profilDogrula.test.ts
 * kaynak dosyayı okuyarak doğrular.
 */

/** app/kayit/page.tsx içindeki `kvkk_metin_versiyonu` ile aynı dize. */
export const KVKK_METIN_VERSIYONU = '2026-08-25-v2'

/** app/kayit/page.tsx içindeki hata cümlesiyle aynı. */
export const KVKK_ONAY_HATASI = "Devam edebilmek için KVKK Aydınlatma Metni'ni okuyup onaylamanız gerekmektedir."

/** Sunucunun 400 yanıtındaki makine kodu — ekran, kutu gizliyse bu kodla görünür kılar. */
export const KVKK_ONAY_KODU = 'KVKK_ONAY_GEREKLI'

/** Kayıtlı rıza: users.kvkk_consent_at dolu YA DA auth metadata kvkk_onay === true (/kayit böyle yazar). */
export function kvkkKayitliMi(satirOnayTarihi: unknown, meta: Record<string, unknown> | null | undefined): boolean {
  if (typeof satirOnayTarihi === 'string' && satirOnayTarihi.trim()) return true
  if (satirOnayTarihi instanceof Date) return true
  return meta?.kvkk_onay === true
}

export type KvkkKarari = {
  /** Ekranda onay kutusu gösterilmeli mi (kayıtlı rıza yok). */
  gerekli: boolean
  /** Bu istek rızayı kaydetmeli mi — yalnız kayıt yokken VE hekim kutuyu işaretlediyse. */
  damgala: boolean
  /** İstek reddedilmeli mi — ilk kayıt, rıza yok, kutu işaretli değil. */
  reddet: boolean
}

/**
 * Tek karar noktası.
 *  • kayıtlı rıza var → sorulmaz, yeniden damgalanmaz (gövdede ne gelirse gelsin).
 *  • kayıt yok + kutu işaretli (tam olarak `true`) → damgala.
 *  • kayıt yok + kutu işaretsiz → onboarding'i ilk kez bitiren hesap reddedilir; zaten onboarding'i bitmiş
 *    bir hesabın çağrısı (bu değişiklikten önceki davranış) reddedilmez ve damgalanmaz.
 */
export function kvkkKarari(g: { kayitli: boolean; ilkKayit: boolean; isaretlendi: unknown }): KvkkKarari {
  if (g.kayitli) return { gerekli: false, damgala: false, reddet: false }
  if (g.isaretlendi === true) return { gerekli: true, damgala: true, reddet: false }
  return { gerekli: true, damgala: false, reddet: g.ilkKayit }
}

/** /kayit'in yazdığı metadata anahtarlarının aynısı. */
export function kvkkMetaDamgasi(simdiIso: string): Record<string, unknown> {
  return { kvkk_onay: true, kvkk_onay_tarihi: simdiIso, kvkk_metin_versiyonu: KVKK_METIN_VERSIYONU }
}

/** users satırı damgası — aynı an, aynı sürüm dizesi. */
export function kvkkSatirDamgasi(simdiIso: string): Record<string, unknown> {
  return { kvkk_consent_at: simdiIso, kvkk_consent_version: KVKK_METIN_VERSIYONU }
}
