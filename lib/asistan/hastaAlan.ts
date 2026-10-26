/**
 * NOTYA-AYSE-ALAN-01 (Dr. Gökhan live feedback; Kaan approved 2026-10-02) — identity and contact fields that never
 * reach the model, filled in by the server.
 *
 * The identity router (lib/doktor/kimlikSorusu.ts) answers parent names, guardian, phone, e-mail, address and birth
 * place without the model, and the chart deliberately never carries those values to the model (KVKK,
 * VELI-YASAL-ONAM). When the doctor's phrasing is one the router does not recognise, the model had nothing to answer
 * with. This module is the model's way to that same reader without ever seeing a value:
 *
 *   1. the read tool `hasta_alan(alan, hasta_adi?)` tells the model only whether the field is recorded, and gives it
 *      an opaque placeholder to write — `{{ALAN:anne_adi}}`;
 *   2. the server replaces the placeholders of the FINAL answer with the values, for the authenticated doctor's own
 *      patient, just before the answer goes to the doctor (`alanlariYerineKoy`);
 *   3. everything that is stored or sent to a model afterwards keeps the placeholder form: the session history holds
 *      the placeholder text plus references (field, patient id) — never a value — and the screen form is rebuilt on
 *      read (app/api/asistan/ses-ekran);
 *   4. a placeholder that was not issued in this turn is removed; a field with no value becomes the existing
 *      sentence that tells the doctor where to add it;
 *   5. spoken form (NOTYA-SES-KIMLIK-OKU-01, Dr. Gökhan 2026-10-25 — supersedes "no identity value is spoken"): names,
 *      birth date and birth place are READ OUT; a phone number or address only when the doctor's own sentence asked to
 *      hear it; e-mail never. A sentence with a value that may not be spoken becomes the pointer sentence ("… ekranınıza
 *      yazdım Hocam"). The spoken value lives in the turn's ledger in memory only — never stored, never sent to a model.
 *
 * No reader lives here: values come from kimlikKaydiOku / kimlikAlanDegeri, which scope by doctor.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { AnthropicArac } from '@/core/eylemler/araclar'
import { kimlikAlanDegeri, kimlikKaydiOku, SOZ_KOSULU, sesteOkunur, type KimlikAlanDegeri, type KimlikAlani } from '@/lib/doktor/kimlikSorusu'
import { EKRANA_YAZDIM, kimlikEkrandaSozu } from '@/lib/asistan/konusma'
import { trAramaNormalize } from '@/lib/utils/turkceArama'

/** Tool field name → the identity reader's field. */
export const ALAN_ADLARI: Record<string, KimlikAlani> = {
  anne_adi: 'anneAdi',
  baba_adi: 'babaAdi',
  veli: 'veli',
  telefon: 'telefon',
  anne_telefon: 'anneTelefon',
  baba_telefon: 'babaTelefon',
  veli_telefon: 'veliTelefon',
  eposta: 'eposta',
  adres: 'adres',
  dogum_yeri: 'dogumYeri',
  dogum_tarihi: 'dogumTarihi',
}

export const HASTA_ALAN_ARACI: AnthropicArac = {
  name: 'hasta_alan',
  description:
    'Bir hastanın kimlik / iletişim alanı sorulduğunda çağır (anne adı, baba adı, veli / yasal temsilci, telefon, annenin / babanın / velinin telefonu, e-posta, adres, doğum yeri, doğum tarihi) — hekim nasıl sorarsa sorsun. Hangi alanın sorulduğuna sen karar ver; birden çok alan için ayrı ayrı çağır. DEĞER DÖNMEZ: alanın kayıtlı olup olmadığı ve cevabına AYNEN yazacağın bir yer tutucu döner; sunucu yer tutucunun yerine değeri hekime göstermeden hemen önce koyar. Değeri tahmin etme, "erişimim yok" DEME.',
  input_schema: {
    type: 'object',
    properties: {
      alan: { type: 'string', enum: Object.keys(ALAN_ADLARI), description: 'Sorulan alan.' },
      hasta_adi: { type: 'string', description: 'Hekimin söylediği hasta adı. Soruda ad yoksa boş bırak: açık dosyanın hastası kullanılır.' },
    },
    required: ['alan'],
  },
}

/** Prompt rule for the single brain's tail (lib/asistan/okumaAraclari.ts). Names no field key: the keys are in the tool schema. */
export const HASTA_ALAN_KURALI = `KİMLİK / İLETİŞİM ALANI (anne adı, baba adı, veli / yasal temsilci, telefon, annenin / babanın / velinin telefonu, e-posta, adres, doğum yeri, doğum tarihi): hekim bunlardan birini NASIL sorarsa sorsun ("annesi kimdi", "aileye nasıl ulaşırım", "nerede oturuyorlar", "hangi şehirde doğmuş") hasta_alan çağır (bu alanlarda hasta_bul yerine bunu kullan); hangi alanın sorulduğuna SEN karar ver, birden çok alan sorulduysa her biri için ayrı çağır. Soruda hasta adı geçiyorsa aracın hasta adı alanına yaz; geçmiyorsa boş bırak (açık dosya kullanılır). Araç sana DEĞERİ VERMEZ: alanın kayıtlı olup olmadığını ve {{ALAN:…}} biçiminde bir yer tutucu verir. Cevabında değerin geleceği yere o yer tutucuyu HARFİ HARFİNE yaz (ör. "Annesinin adı {{ALAN:…}}." — üç nokta yerine aracın verdiği ad); sunucu, cevabı hekime göstermeden önce gerçek değeri yerine koyar. Değeri tahmin etme, uydurma; yer tutucuyu değiştirme, çevirme, açıklama. Araç "kayıtlı değil" derse yer tutucuyu tek başına bir cümle olarak yaz; sunucu yerine bilginin nereden ekleneceğini söyleyen cümleyi koyar. Sunucu sesli okumada ad, doğum tarihi ve doğum yerini yer tutucunun yerine okur (telefon / adres yalnız hekim sesle isterse, e-posta asla); cümleni doğal kur, "ekrana bak" ile bitirme. Bu turda aracın VERMEDİĞİ bir yer tutucuyu (ör. geçmişteki bir cevaptan) yazma: silinir. "Erişimim yok / bu bilgiyi göremiyorum" DEME.`

/** What the session stores about a placeholder: which field of which patient. Never a value. */
export interface AlanRef {
  /** The key inside the braces: `anne_adi`, or `anne_adi#2` for the second patient of one turn. */
  anahtar: string
  alan: KimlikAlani
  hastaId: string
}

interface VerilenAlan extends AlanRef {
  hastaAd: string
  durum: 'var' | 'eksik'
  /** The "where to add it" sentence when it carries no value (it can be spoken); null when the text carries a value. */
  sozluMetin: string | null
  /** The value in its spoken form, only when this turn may speak it (SOZ_KOSULU + the doctor's request); else null. In memory for the turn. */
  soz: string | null
}

const YER_TUTUCU = /\{\{\s*ALAN\s*:\s*([a-z_]+(?:#\d+)?)\s*\}\}/gi
export const yerTutucu = (anahtar: string): string => `{{ALAN:${anahtar}}}`
const anahtarDuz = (ham: string): string => ham.toLowerCase().replace(/\s+/g, '')

/** The field key a model sent, however it spelled it ("anne adı", "Anne_Adi", "baba-adi"). */
const BITISIK = new Map(Object.keys(ALAN_ADLARI).map((k) => [k.replace(/_/g, ''), k]))
export function alanAnahtari(ham: unknown): string | null {
  return BITISIK.get(trAramaNormalize(String(ham ?? '')).replace(/[^a-z0-9]+/g, '')) ?? null
}

/**
 * The placeholders issued in ONE turn. Created by the brain per turn and handed to the tool executor; holds
 * references and status only — no value is kept here, in memory or anywhere else.
 */
export class AlanDefteri {
  private readonly hastalar: string[] = []
  private readonly verilen = new Map<string, VerilenAlan>()

  /** Register a field of a patient and return the placeholder the model must write. */
  ver(alanAdi: string, hasta: { id: string; ad: string }, d: Pick<KimlikAlanDegeri, 'durum' | 'metin' | 'degerli' | 'soz'>, sesliIstek = false): string {
    let sira = this.hastalar.indexOf(hasta.id)
    if (sira < 0) sira = this.hastalar.push(hasta.id) - 1
    const anahtar = sira === 0 ? alanAdi : `${alanAdi}#${sira + 1}`
    this.verilen.set(anahtar, this.kayit(anahtar, ALAN_ADLARI[alanAdi], hasta, d, sesliIstek))
    return yerTutucu(anahtar)
  }

  private kayit(anahtar: string, alan: KimlikAlani, hasta: { id: string; ad: string }, d: Pick<KimlikAlanDegeri, 'durum' | 'metin' | 'degerli' | 'soz'>, sesliIstek: boolean): VerilenAlan {
    return {
      anahtar, alan, hastaId: hasta.id, hastaAd: hasta.ad, durum: d.durum,
      sozluMetin: d.durum === 'eksik' && !d.degerli ? d.metin : null,
      soz: d.durum === 'var' && d.soz && sesteOkunur(SOZ_KOSULU[alan], sesliIstek) ? d.soz : null,
    }
  }

  /** Rebuild the entry of a stored reference (reading a stored answer aloud): the same rule, the value read now. */
  geriYukle(r: AlanRef, hasta: { id: string; ad: string }, d: Pick<KimlikAlanDegeri, 'durum' | 'metin' | 'degerli' | 'soz'>, sesliIstek: boolean): void {
    this.verilen.set(anahtarDuz(r.anahtar), this.kayit(anahtarDuz(r.anahtar), r.alan, hasta, d, sesliIstek))
  }

  bul(anahtar: string): VerilenAlan | null {
    return this.verilen.get(anahtarDuz(anahtar)) ?? null
  }

  get bos(): boolean { return this.verilen.size === 0 }

  /** References of the issued placeholders that this text actually uses (for the session record and the audit log). */
  kullanilan(metin: string): AlanRef[] {
    const out = new Map<string, AlanRef>()
    for (const m of String(metin || '').matchAll(YER_TUTUCU)) {
      const v = this.bul(m[1])
      if (v) out.set(v.anahtar, { anahtar: v.anahtar, alan: v.alan, hastaId: v.hastaId })
    }
    return [...out.values()]
  }
}

/** Spacing and punctuation after a placeholder was replaced or removed. */
function toparla(metin: string): string {
  return metin
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[ \t]+([.,;:!?])/g, '$1')
    .replace(/(?<!\.)\.\.(?!\.)/g, '.')
    .replace(/[ \t]+\n/g, '\n')
    .trim()
}

/**
 * The placeholder form that may be stored and sent to a model: placeholders issued in this turn stay (in their
 * canonical spelling), every other one is removed. `defter` null → every placeholder is removed.
 */
export function verilmeyenleriSil(metin: string, defter: AlanDefteri | null): { metin: string; silinen: number } {
  let silinen = 0
  const ham = String(metin || '')
  const out = ham.replace(YER_TUTUCU, (_t, anahtar: string) => {
    const v = defter?.bul(anahtar)
    if (v) return yerTutucu(v.anahtar)
    silinen++
    return ''
  })
  return { metin: silinen || out !== ham ? toparla(out) : ham, silinen }
}

const YER_TUTUCU_TEK = new RegExp(YER_TUTUCU.source, 'i')
export function yerTutucuVarMi(metin: string | null | undefined): boolean {
  return YER_TUTUCU_TEK.test(String(metin || ''))
}

/**
 * The doctor's form of an answer: each referenced placeholder becomes the value (or, for a field with no value, the
 * sentence that says where to add it). Values are read here, at delivery, with the AUTHENTICATED doctor's id —
 * HASTA-IZOLASYON-01: a reference to a patient who is not this doctor's reads nothing and the placeholder is removed.
 * A placeholder with no reference is removed.
 */
export async function alanlariYerineKoy(supabase: SupabaseClient, doktorId: string, metin: string, refler: AlanRef[], nowMs = Date.now()): Promise<string> {
  const ham = String(metin || '')
  if (!yerTutucuVarMi(ham)) return ham
  const ref = new Map(refler.filter((r) => r && typeof r.anahtar === 'string' && typeof r.hastaId === 'string').map((r) => [anahtarDuz(r.anahtar), r]))
  const hastaIdleri = [...new Set([...ref.values()].map((r) => r.hastaId))]
  const kayitlar = new Map(await Promise.all(hastaIdleri.map(async (id) => [id, await kimlikKaydiOku(supabase, doktorId, id).catch(() => null)] as const)))
  return toparla(ham.replace(YER_TUTUCU, (_t, anahtar: string) => {
    const r = ref.get(anahtarDuz(anahtar))
    const kayit = r ? kayitlar.get(r.hastaId) : null
    if (!r || !kayit || !Object.values(ALAN_ADLARI).includes(r.alan)) return ''
    return kimlikAlanDegeri(r.alan, kayit, nowMs).metin
  }))
}

/**
 * A ledger for a STORED answer that is read aloud ("bana oku"): the references the answer was stored with, read now with
 * the authenticated doctor's id (HASTA-IZOLASYON-01 — a patient who is not this doctor's reads nothing).
 */
export async function defteriGeriKur(supabase: SupabaseClient, doktorId: string, refler: AlanRef[], sesliIstek: boolean, nowMs = Date.now()): Promise<AlanDefteri> {
  const defter = new AlanDefteri()
  const gecerli = (refler || []).filter((r) => r && typeof r.anahtar === 'string' && typeof r.hastaId === 'string' && Object.values(ALAN_ADLARI).includes(r.alan))
  const kayitlar = new Map(await Promise.all([...new Set(gecerli.map((r) => r.hastaId))].map(async (id) => [id, await kimlikKaydiOku(supabase, doktorId, id).catch(() => null)] as const)))
  for (const r of gecerli) {
    const kayit = kayitlar.get(r.hastaId)
    if (kayit) defter.geriYukle(r, { id: r.hastaId, ad: kayit.ad }, kimlikAlanDegeri(r.alan, kayit, nowMs), sesliIstek)
  }
  return defter
}

/**
 * Spoken form, one sentence at a time (the `temizle` hook of SesAkisi). A value this turn may speak is read out; a
 * sentence with one it may not is not read: once per turn the doctor hears where it is. A field with no value is spoken as its "where to add it"
 * sentence. A placeholder that was not issued is dropped. `defter` null: the turn has no ledger (reading a stored
 * answer aloud) — any sentence with a placeholder becomes one pointer to the screen.
 */
export function alanSozcusu(defter: AlanDefteri | null, degerSoyle = true): (cumle: string) => string {
  let soylendi = false
  return (cumle) => {
    if (!yerTutucuVarMi(cumle)) return cumle
    let degerli: VerilenAlan | null = null
    const out = cumle.replace(YER_TUTUCU, (t, anahtar: string) => {
      const v = defter?.bul(anahtar)
      if (!v) return defter ? '' : t
      if (v.sozluMetin != null) return v.sozluMetin
      // NOTYA-SES-KIMLIK-OKU-01: a value this turn may speak is read inline; `degerSoyle` false (text that is STORED, e.g.
      // the remainder of a cut voice turn) keeps the pointer — no value is ever written to the session.
      if (degerSoyle && v.soz != null) return v.soz
      degerli = degerli ?? v; return t
    })
    if (degerli || !defter) {
      if (soylendi) return ''
      soylendi = true
      return degerli ? kimlikEkrandaSozu((degerli as VerilenAlan).hastaAd) : EKRANA_YAZDIM
    }
    return toparla(out)
  }
}
