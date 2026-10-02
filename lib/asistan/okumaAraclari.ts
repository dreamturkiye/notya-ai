/**
 * NOTYA-AYSE-ARAC-PARITE (2026-10-02) — the READ tools of the single brain.
 *
 * Until 2026-09-25 the voice model had two read tools as ElevenLabs client tools (scripts/_el-tool-kur.mts):
 * `hasta_bul` (the doctor's whole sentence → patient, chart, practice search, identity) and `randevu_takvim`
 * (a day of the calendar). The single brain (lib/asistan/ayseCevapla.ts) answered reads with model-free routers and
 * never offered them, so every router gap was a dead end. They are restored here with the SAME names and parameter
 * schemas, executed in process by the functions that already existed:
 *
 *   hasta_bul       the /api/asistan/hasta-bul route logic — scope gate, kimlikSorusunuCevapla, hastaninSozunuCoz
 *                   (name + practice search), chart package, quick card — plus what the single brain added for an open
 *                   chart: the open patient answers an unnamed question (aktifHastaKullanilsinMi), the visit
 *                   measurement of NOTYA-DANIS-OLCUM (dosyaSorgu/vizitOlcum) and the evidence block (dosyaSorgu/kanit).
 *   randevu_takvim  the /api/asistan/ses-eylem `takvim` step — doktorunGununuOku + gunlukOzetMetni — and, when no time
 *                   is asked, the day's free ranges (bosSaatMetni), which the calendar router already reads.
 *
 * No search or business logic lives here: wiring only.
 *
 * HASTA-IZOLASYON-01: a tool takes TEXT and a DATE, never an id. Every executor is called with the authenticated
 * doctor's id; the resolver, the chart package, the identity read and the calendar read each scope by that doctor.
 * The open patient's id comes from the session and is re-checked with hastaSahibiMi before it becomes the chart.
 * A name that belongs to another doctor's patient is indistinguishable from a name nobody has.
 *
 * VELI-YASAL-ONAM / NOTYA-BETA-0925: identity and contact VALUES never go back to the model. The executor returns the
 * value-less `model` text as the tool result and hands the caller the screen text (`kimlik`).
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { AnthropicArac } from '@/core/eylemler/araclar'
import { HASTA_BUL_KURALI, RANDEVU_TAKVIM_KURALI } from '@/lib/asistan/personaEngine'
import { kapsamKarariHastayla, KAPSAM_RED, KAPSAM_SORU } from '@/lib/asistan/kapsamKilidi'
import { kimlikAlanDegeri, kimlikAlanEtiketi, kimlikKaydiOku, kimlikSorusunuCevapla, type KimlikCevabi } from '@/lib/doktor/kimlikSorusu'
import { ALAN_ADLARI, AlanDefteri, alanAnahtari, HASTA_ALAN_ARACI, HASTA_ALAN_KURALI } from '@/lib/asistan/hastaAlan'
import { cozumKonus, duzle, hastaninSozunuCoz } from '@/lib/doktor/hastaCozumleyici'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'
import { dosyaPaketOnbellekli } from '@/lib/doktor/ogrenme/dosyaOnbellek'
import { dosyaSoruCevap, kartSoyle, type HastaDosyaKart } from '@/lib/doktor/hastaDosyaKart'
import type { DosyaHastasi, DosyaOlayi } from '@/lib/doktor/dosyaOlaylari'
import { aktifHastaKullanilsinMi, kohortSorusuMu } from '@/lib/asistan/aktifHasta'
import { soruTuruBul, type SoruTuru } from '@/lib/asistan/dosyaSorgu/soruTuru'
import { kanitBlogu } from '@/lib/asistan/dosyaSorgu/kanit'
import { dosyaSorguKuralBlogu } from '@/lib/asistan/dosyaSorgu/kurallar'
import { vizitOlcumCevabi, vizitOlcumKaniti, vizitOlcumSorusuBul } from '@/lib/asistan/dosyaSorgu/vizitOlcum'
import { takvimSorusuCoz, type TakvimSorusu } from '@/lib/randevu/takvimSorusu'
import { doktorunGununuOku, gunlukOzetMetni, haftalikOzetMetni } from '@/lib/randevu/gunlukOzet'
import { bosSaatMetni, doktorCalismaGunu } from '@/lib/randevu/bosSaatler'
import { bugunTz, isoGunKaydir } from '@/lib/randevu/tarihCozumle'
import { anilanKisi } from '@/lib/randevu/randevuSozu'

/** Names, descriptions and parameters are the ones registered on the voice agents (scripts/_el-tool-kur.mts). */
export const OKUMA_ARACLARI: AnthropicArac[] = [
  {
    name: 'hasta_bul',
    description:
      'Doktor hasta listesi, sayısı, kendi pratiği VEYA açık bir hastanın dosyası sorduğunda çağır: ad, yaş, alerji, son reçete, kaç vizit, randevu, lab, aşı, "hangi antibiyotiği / ilacı / aşıyı / tanıyı en fazla yazdım-koydum", kimlik / iletişim (anne-baba adı, veli, telefon, e-posta, adres, doğum yeri). Tam cümleyi isim olarak gönder. Dönen sayıyı, sıralamayı ve "Dosyada …" cümlesini oku. Kimlik değerleri sana gelmez, ekrana yazılır — "ekranınıza yazdım" de, değer uydurma. "erişimim yok" / "bilemedim" DEME.',
    input_schema: {
      type: 'object',
      properties: {
        isim: { type: 'string', description: 'Tam cümle. Örn: "Ahmet\'in alerjisi ne", "son reçetesi", "kaç viziti var", "son bir ay içinde hangi antibiyotiği en fazla yazdım", "Ayşe Metin", "Umutcan\'ın annesinin adı ne"' },
      },
      required: ['isim'],
    },
  },
  {
    name: 'randevu_takvim',
    description:
      'Doktor o günün randevularını veya bir saatin boş olup olmadığını sorduğunda çağır. KAYIT YAPMAZ — takvimi okur. "takvimi göremem / iznim yok" DEME: bu araç vardır. Dönen Türkçe metni oku.',
    input_schema: {
      type: 'object',
      properties: {
        tarih: { type: 'string', description: 'Gün YYYY-MM-DD (Türkiye). Örn 2026-09-25' },
        saat: { type: 'string', description: 'Kontrol edilecek saat HH:MM (24s). Örn 09:00. Yoksa yalnız gün listesi.' },
        sure_dk: { type: 'string', description: 'Süre dakika, varsayılan 20' },
      },
      required: ['tarih'],
    },
  },
  // NOTYA-AYSE-ALAN-01: an identity / contact field as a placeholder — the value never comes back (lib/asistan/hastaAlan.ts).
  HASTA_ALAN_ARACI,
]

const OKUMA_ARAC_ADLARI = new Set(OKUMA_ARACLARI.map((a) => a.name))
export function okumaAraciMi(ad: unknown): boolean {
  return OKUMA_ARAC_ADLARI.has(String(ad || ''))
}

/** Kill switch, like AYSE_EYLEM_KAPALI: `AYSE_OKUMA_ARACI_KAPALI=1` → no read tool is offered, the brain is as it was. */
export function okumaAraciKapali(): boolean {
  return String(process.env.AYSE_OKUMA_ARACI_KAPALI || '').trim() === '1'
}

/** The model may look things up at most this many times in one turn; after that it answers with what it has. */
export const OKUMA_TUR_TAVANI = 2
/** One tool execution never holds the turn longer than this (tests shorten it). */
export const OKUMA_AYARI = { zamanAsimiMs: 8_000 }

/**
 * Tail block of the single brain's prompt on a turn that offers the read tools. The rules are the voice prompt's own
 * (personaEngine.ts); the last paragraph fits them to a brain that may already hold the chart.
 */
export const OKUMA_ARACI_BLOGU = `

[OKUMA ARAÇLARI — bu turda sana verildi: ${OKUMA_ARACLARI.map((a) => a.name).join(', ')}]
${HASTA_BUL_KURALI}
${RANDEVU_TAKVIM_KURALI}
${HASTA_ALAN_KURALI}
Cevap yukarıdaki dosya bloğunda, HIZLI KART'ta ya da kanıt bloğunda zaten varsa araç çağırma, oradan cevapla. Orada yoksa, dosya verilmediyse ya da soru muayenehanenin geneliyle (sayı, sıralama, liste), bir hastanın kimlik / iletişim bilgisiyle ya da takvimle ilgiliyse "bilemedim" DEME, hekime "adını söyleyin" DEME: önce aracı çağır. "Bu turda açık hasta dosyası yok" notu yalnız kendi bilginden dosya uydurmanı yasaklar; aracın döndürdüğü bilgi dosya bilgisidir. Aracın döndürdüğü sayıyı, sıralamayı, tarihi, değeri ve birimi AYNEN aktar; araç "bulamadım / kayıt yok" dediyse onu söyle, değer uydurma.`

export interface OkumaBaglami {
  supabase: SupabaseClient
  /** The AUTHENTICATED doctor. Never taken from model output. */
  doktorId: string
  saatDilimi: string
  /** The session's open patient (id from the session, re-checked here before it is used). */
  aktifHasta: { id: string; ad: string } | null
  /** First name of the colleague the doctor is talking to — the resolver's bare-name guard. */
  hitapAdi?: string
  /** NOTYA-AYSE-ALAN-01: the turn's placeholder ledger. hasta_alan registers what it issues here; references only. */
  alanDefteri?: AlanDefteri
}

export interface OkumaSonucu {
  /** The tool result the model reads. Carries no identity / contact value. */
  sonuc: string
  /** The same answer as a sentence fit for the doctor, when the result is one (used if the model adds nothing). */
  hekimMetni?: string
  /** Identity answer: `ekran` (with values) goes to the doctor's screen only. */
  kimlik?: KimlikCevabi
  /** Patient the result is about, resolved among this doctor's patients. */
  hasta?: { id: string; ad: string } | null
  hata?: boolean
}

const ULASILAMADI = 'Dosyaya şu an ulaşamadım, kısa bir süre sonra tekrar deneyin.'

/**
 * NOTYA-AYSE-GERI-03 (wrong-patient guard), shared by the brain and the tool: the sentence names a person as the one
 * it is about and that name is not the open patient's — the open chart is not a substitute for the person named.
 */
export function anilanBaskaKisi(mesaj: string, acikHastaAdi: string | null | undefined): string | null {
  const anilan = anilanKisi(mesaj)
  if (!anilan) return null
  const acikAd = acikHastaAdi ? duzle(String(acikHastaAdi)).split(' ') : []
  return duzle(anilan).split(' ').some((p) => p.length >= 3 && acikAd.includes(p)) ? null : anilan
}

/** Calendar read for a resolved calendar question — the same readers, in the same order, as the brain's fast path. */
async function takvimOku(b: OkumaBaglami, t: TakvimSorusu): Promise<OkumaSonucu> {
  const { supabase, doktorId, saatDilimi } = b
  if (t.aralik) {
    const gunler: string[] = []
    for (let g = t.aralik.bas; g <= t.aralik.bit && gunler.length < 7; g = isoGunKaydir(g, 1)) gunler.push(g)
    const okunan = await Promise.all(gunler.map(async (tarih) => ({ tarih, satirlar: await doktorunGununuOku(supabase, doktorId, tarih, saatDilimi) })))
    const hafta = haftalikOzetMetni({ bas: t.aralik.bas, bit: t.aralik.bit, gunler: okunan, tz: saatDilimi })
    return { sonuc: hafta.metin, hekimMetni: hafta.metin }
  }
  const satirlar = await doktorunGununuOku(supabase, doktorId, t.tarih, saatDilimi)
  if (t.bosluk) {
    const bos = bosSaatMetni({ tarih: t.tarih, satirlar, gun: await doktorCalismaGunu(supabase, doktorId, t.tarih), tz: saatDilimi })
    return { sonuc: bos.metin, hekimMetni: bos.metin }
  }
  const ozet = gunlukOzetMetni({ tarih: t.tarih, satirlar, istenenSaat: t.saat, istenenSureDk: 20 })
  return { sonuc: ozet.metin, hekimMetni: ozet.metin }
}

async function randevuTakvim(b: OkumaBaglami, g: Record<string, unknown>): Promise<OkumaSonucu> {
  const { supabase, doktorId, saatDilimi } = b
  const tarihHam = String(g.tarih ?? g.gun ?? '').trim()
  const tarih = /^\d{4}-\d{2}-\d{2}$/.test(tarihHam) ? tarihHam : bugunTz(saatDilimi)
  const saatHam = String(g.saat ?? '').trim()
  const saat = /^([01]\d|2[0-3]):([0-5]\d)$/.test(saatHam) ? saatHam : null
  const sureHam = Number(g.sure_dk ?? g.sureDk ?? 20)
  const sure = Number.isFinite(sureHam) && sureHam >= 5 && sureHam <= 240 ? sureHam : 20
  const satirlar = await doktorunGununuOku(supabase, doktorId, tarih, saatDilimi)
  const ozet = gunlukOzetMetni({ tarih, satirlar, istenenSaat: saat, istenenSureDk: sure })
  if (saat) return { sonuc: ozet.metin, hekimMetni: ozet.metin }
  // No time asked: the day list and the day's free ranges — "bugün ne zaman boşum" needs both.
  const bos = bosSaatMetni({ tarih, satirlar, gun: await doktorCalismaGunu(supabase, doktorId, tarih), tz: saatDilimi })
  const metin = `${ozet.metin}\n${bos.metin}`
  return { sonuc: metin, hekimMetni: metin }
}

async function hastaBul(b: OkumaBaglami, g: Record<string, unknown>): Promise<OkumaSonucu> {
  const { supabase, doktorId, saatDilimi } = b
  const soz = String(g.isim ?? g.hastaAdi ?? '').replace(/\s+/g, ' ').trim().slice(0, 600)
  if (!soz) return { sonuc: 'Hasta adını anlayamadım, tekrar söyler misiniz?' }
  // The route's scope gate, on the sentence the model wrote.
  const kapsam = await kapsamKarariHastayla(supabase, doktorId, soz)
  if (kapsam !== 'ic') return { sonuc: kapsam === 'disi' ? KAPSAM_RED : KAPSAM_SORU }

  // A calendar sentence sent here is still a calendar question.
  const takvim = takvimSorusuCoz(soz, { saatDilimi })
  if (takvim) return takvimOku(b, takvim)

  const aktifId = b.aktifHasta?.id || null
  // The identity read falls back to the open patient only when the sentence names nobody else: a named person who
  // is not found must not be answered with the open patient's parents or phone.
  const kimlik = await kimlikSorusunuCevapla(supabase, doktorId, soz, anilanBaskaKisi(soz, b.aktifHasta?.ad) ? null : aktifId)
  if (kimlik) return kimlik.hasta ? { sonuc: kimlik.model, kimlik, hasta: kimlik.hasta } : { sonuc: kimlik.model, hekimMetni: kimlik.ekran }

  // Same binding rules as the brain (NOTYA-AKTIF-HASTA-01): a name in the sentence wins; an unnamed, non-cohort
  // question is about the open chart; a named person who was not found is never replaced by the open chart.
  const acikDosyaSorusu = Boolean(aktifId) && !kohortSorusuMu(soz)
  let cozum = await hastaninSozunuCoz(supabase, doktorId, soz, { tz: saatDilimi, kohortsuz: acikDosyaSorusu, hitapAdi: b.hitapAdi })
  const aramaSonucu = Boolean((cozum as { sayiMetin?: string }).sayiMetin)
  const baskaKisi = cozum.tur === 'yok' && !aramaSonucu ? anilanBaskaKisi(soz, b.aktifHasta?.ad) : null
  const adBelirsiz = cozum.tur === 'yok' && Boolean(cozum.cokAday)
  const aktifeDon = !baskaKisi && !adBelirsiz && aktifHastaKullanilsinMi({ aktifHastaVar: Boolean(aktifId), cozumTur: cozum.tur, aramaSonucu, mesaj: soz })
  if (aktifeDon && aktifId && cozum.tur !== 'tek' && (await hastaSahibiMi(supabase, doktorId, aktifId))) {
    cozum = { tur: 'tek', patientId: aktifId, ad: b.aktifHasta?.ad || '' }
  }
  const konus = aktifeDon ? null : cozumKonus(cozum)
  if (konus) return { sonuc: konus, hekimMetni: konus, hasta: cozum.tur === 'tek' && cozum.cevap ? { id: cozum.patientId, ad: cozum.ad } : null }
  if (cozum.tur !== 'tek') {
    if (baskaKisi) {
      const yok = `“${baskaKisi.slice(0, 80)}” adında bir hasta kayıtlarınızda bulamadım Hocam; adını ve soyadını tam söyler misiniz?`
      return { sonuc: yok, hekimMetni: yok }
    }
    return { sonuc: 'Bu filtrelere uyan hasta yok Hocam. Yaş, hafta, gelme nedeni, tanı veya adla tekrar dener misiniz?' }
  }

  // The chart package narrows every query by doctor AND patient again.
  const paket = await dosyaPaketOnbellekli(supabase, doktorId, cozum.patientId)
  if (!paket) return { sonuc: `${cozum.ad || 'Hasta'} için dosya bulamadım.` }
  const ad = cozum.ad || paket.ad || 'Hasta'
  const hasta = { id: cozum.patientId, ad }
  const olaylar = (paket.olaylar || []) as DosyaOlayi[]
  const sorguHasta = paket.sorguHasta as DosyaHastasi | undefined

  // NOTYA-DANIS-OLCUM: the measurement of one named exam (or a series) comes from the record, never the quick card's
  // "latest measurement".
  const olcum = vizitOlcumSorusuBul(soz)
  if (olcum?.kesin) {
    const c = vizitOlcumCevabi(vizitOlcumKaniti(olcum, olaylar, { dogumIso: sorguHasta?.dogumIso ?? null }), ad)
    return { sonuc: c.ekran, hekimMetni: c.ekran, hasta }
  }
  // NOTYA-AYSE-STANDART-01: a chart question with an evidence plan gets its evidence block (an evaluation of one
  // exam's measurement is a growth-evidence question, as in the brain).
  const soruTuru: SoruTuru | null = soruTuruBul(soz) ?? (olcum ? 'buyume' : null)
  if (soruTuru && sorguHasta) {
    return { sonuc: `${ad} — dosya sorgusu.${dosyaSorguKuralBlogu(ad)}\n${kanitBlogu(soruTuru, olaylar, sorguHasta, { mesaj: soz })}`, hasta }
  }
  const kesin = dosyaSoruCevap(soz, paket.kart as HastaDosyaKart)
  const metin = `${ad}. ${kesin || kartSoyle(paket.kart as HastaDosyaKart)}`
  return { sonuc: metin, hekimMetni: metin, hasta }
}

const HANGI_HASTA = 'Hangi hastanın bilgisini istiyorsunuz? Adını yazar mısınız?'
const HASTA_BULUNAMADI = 'Bu hastayı kayıtlarınızda bulamadım.'

/**
 * NOTYA-AYSE-ALAN-01 — one identity / contact field of one patient, as a placeholder. The reader is the identity
 * router's own (kimlikKaydiOku: patient card, latest Hasta Bilgi Formu, document summaries); the result says only
 * whether the field is recorded and which placeholder to write. The VALUE IS NEVER PART OF THE RESULT.
 *
 * HASTA-IZOLASYON-01: the patient is a NAME the model wrote (resolved among this doctor's patients) or the session's
 * open patient (re-checked here); the record is read with the doctor's id. Another doctor's patient gets the same
 * sentence as a name nobody has. A name that was given and not found is never replaced by the open chart.
 */
async function hastaAlan(b: OkumaBaglami, g: Record<string, unknown>): Promise<OkumaSonucu> {
  const { supabase, doktorId, saatDilimi } = b
  const alanAdi = alanAnahtari(g.alan)
  if (!alanAdi) return { sonuc: `Bu alan tanımlı değil. Geçerli alanlar: ${Object.keys(ALAN_ADLARI).join(', ')}.`, hata: true }
  const adHam = String(g.hasta_adi ?? g.hastaAdi ?? '').replace(/\s+/g, ' ').trim().slice(0, 120)
  let hedef: { id: string; ad: string } | null = null
  if (adHam) {
    const cozum = await hastaninSozunuCoz(supabase, doktorId, adHam, { yalnizAd: true, adKesin: true, tz: saatDilimi })
    if (cozum.tur === 'coklu') {
      const soru = cozumKonus(cozum) || 'Bu isimle birden çok hasta var Hocam; hangisi?'
      return { sonuc: soru, hekimMetni: soru }
    }
    if (cozum.tur !== 'tek') return { sonuc: HASTA_BULUNAMADI, hekimMetni: HASTA_BULUNAMADI }
    hedef = { id: cozum.patientId, ad: cozum.ad }
  } else if (b.aktifHasta?.id && (await hastaSahibiMi(supabase, doktorId, b.aktifHasta.id))) {
    hedef = { id: b.aktifHasta.id, ad: b.aktifHasta.ad }
  }
  if (!hedef) return { sonuc: HANGI_HASTA, hekimMetni: HANGI_HASTA }
  const kayit = await kimlikKaydiOku(supabase, doktorId, hedef.id)
  if (!kayit) return { sonuc: HASTA_BULUNAMADI, hekimMetni: HASTA_BULUNAMADI }
  const hasta = { id: hedef.id, ad: hedef.ad || kayit.ad }
  const alan = ALAN_ADLARI[alanAdi]
  const deger = kimlikAlanDegeri(alan, kayit)
  const yer = (b.alanDefteri ?? new AlanDefteri()).ver(alanAdi, hasta, deger)
  const etiket = kimlikAlanEtiketi(alan)
  // Audit trail: which field of which patient was asked for — references, never the value.
  console.info('[asistan/okuma-araci] alan', { alan: alanAdi, hasta: hasta.id, durum: deger.durum })
  if (deger.durum === 'var') {
    return {
      sonuc: `${hasta.ad} — ${etiket} kayıtlı. Değer sana verilmez. Cevabında değerin geleceği yere şunu AYNEN yaz: ${yer} — sunucu, cevabı hekime göstermeden önce gerçek değeri yerine koyar. Değeri tahmin etme; "erişimim yok" DEME.`,
      hekimMetni: `${hasta.ad} — ${etiket}: ${yer}`,
      hasta,
    }
  }
  return {
    sonuc: `${hasta.ad} — ${etiket} kayıtlı değil. Cevabına şunu AYNEN, tek başına bir cümle olarak yaz: ${yer} — sunucu yerine, hekime bilgiyi nereden ekleyeceğini söyleyen cümleyi koyar.`,
    hekimMetni: `${hasta.ad} — ${yer}`,
    hasta,
  }
}

/**
 * Run one read tool for the authenticated doctor. Never throws: a failure or a timeout is a tool result the model can
 * report ("dosyaya şu an ulaşamadım"), and nothing of the error text reaches the model.
 */
export async function okumaAraciCalistir(ad: string, girdi: unknown, b: OkumaBaglami): Promise<OkumaSonucu> {
  const g = (girdi && typeof girdi === 'object' && !Array.isArray(girdi) ? girdi : {}) as Record<string, unknown>
  const is = ad === 'hasta_bul' ? hastaBul(b, g) : ad === 'randevu_takvim' ? randevuTakvim(b, g) : ad === 'hasta_alan' ? hastaAlan(b, g) : null
  if (!is) return { sonuc: 'Bu araç tanımlı değil.', hata: true }
  let zamanlayici: ReturnType<typeof setTimeout> | undefined
  const sinir = new Promise<OkumaSonucu>((r) => { zamanlayici = setTimeout(() => r({ sonuc: ULASILAMADI, hata: true }), OKUMA_AYARI.zamanAsimiMs) })
  try {
    return await Promise.race([
      is.catch((e) => {
        console.error('[asistan/okuma-araci]', ad, e instanceof Error ? e.message : String(e))
        return { sonuc: ULASILAMADI, hata: true } as OkumaSonucu
      }),
      sinir,
    ])
  } finally {
    if (zamanlayici) clearTimeout(zamanlayici)
  }
}
