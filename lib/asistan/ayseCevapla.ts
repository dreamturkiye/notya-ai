/**
 * NOTYA-TEK-BEYIN (Kaan, 2026-09-25) — Ayşe'nin TEK beyni: yazılı sohbet ve sesli Ayşe aynı fonksiyondan cevaplanır.
 *
 * Önce iki ayrı asistan vardı: yazı /api/asistan/chat boru hattını, ses ise ElevenLabs'te barındırılan bir modeli
 * (promptun bir KOPYASI + tarayıcı client tool'ları: hasta_bul, ses-eylem) çalıştırıyordu; her özellik iki kez
 * yazılıp ayrışıyordu (NOTYA-SES-HASTA-01: sesin bulamadığı hastayı yazı buldu). Artık:
 *   - /api/asistan/chat bu fonksiyonun ince sarmalayıcısıdır (kanal: 'yazi');
 *   - ElevenLabs Custom LLM ucu /api/asistan/ses-llm aynı fonksiyonu çağırır (kanal: 'ses'); ElevenLabs yalnız
 *     dinler, sıra alır ve konuşur.
 * Aynı oturum (asistan_sessions) iki kanalın hafızasıdır: sesle başlayıp yazıyla süren TEK konuşma, TEK aktif hasta.
 * NOTYA-AKTIF-HASTA-01 (Kaan kararı 2026-09-29, NOTYA-SES-DOSYA-ISTE-01 geri alındı): açık hasta (adla açılan ya da
 * doktorun açık sayfası) adsız soruları cevaplar; dosya o hastaya bağlanır — 30 branş ve Klinik aynı omurgayı kullanır.
 *
 * Çıktı iki biçimdir: `ekran` (biçimli tam cevap) ve `konusma` (aynı içerik, doğal Türkçe cümlelerle — yazılı kadar
 * ayrıntılı; yalnız kimlik / iletişim değerleri ve tablolar ekranda kalır — lib/asistan/konusma.ts). Aynı soru iki
 * kanalda aynı `ekran`ı verir (lib/asistan/tekBeyin.test.ts).
 *
 * Korunan kurallar (yazılı rotadaki sırayla, birebir): HASTA-IZOLASYON-01 (her hasta kimliği doktora kapsanır),
 * VELI-YASAL-ONAM + NOTYA-BETA-0925 (kimlik soruları modelsiz; değer saklanan geçmişe / modele girmez),
 * NOTYA-SES-HASTA-01 (hastaninSozunuCoz), branş kilitleri, doz ve kaynak kilidi, F3/F4 temizliği, NOTYA-EYLEM
 * (araç çağrısı yalnız taslak + onay kartı), NOTYA-KOTA-01, NOTYA-MALIYET-01, NOTYA-OGRENME-03.
 *
 * Bu fonksiyon bir model turudur ve kayıt YAPAMAZ (onayla.ts'e erişmez — core/eylemler/tests/sessizYol.test.ts):
 * kartlar yalnız taslaktır. Sesli "Evet / Onaylıyorum / Hayır" model turu değildir; ses ucu onu önce
 * lib/asistan/sesliOnay.ts'e verir (dokunuşla aynı omurga). Yazılı kanalda onay hâlâ karttaki dokunuştur.
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import { PERSONAS, varsayilanPersonaId, buildSystemPromptParcalari, type PersonaId } from "@/lib/asistan/personaEngine"
import { kapsamKarariHastayla } from "@/lib/asistan/kapsamKilidi"
import { KAPSAM_RED, KAPSAM_SORU, kapsamRedMi } from "@/lib/asistan/kapsamRed"
import { asistanOnbellekBloklari } from "@/lib/asistan/onbellekBloklari"
import { dahiliyeKilidi, dahiliyeMi } from "@/specialties/dahiliye/prompts"
import { kadinDogumKilidi, kadinDogumMi } from "@/specialties/kadin-dogum/prompts"
import { dermatolojiKilidi, dermatolojiMi } from "@/specialties/dermatoloji/prompts"
import { gozKilidi, gozMi } from "@/specialties/goz-hastaliklari/prompts"
import { dozKilitliBrans } from "@/lib/doktor/soapUret"
import { kaynakSayilari, uydurmaDozTemizle } from "@/lib/doktor/dozKilidi"
import { uydurmaKaynakTemizle } from "@/lib/doktor/kaynakKilidi"
import { kdDogrulanmisKaynaklar } from "@/specialties/kadin-dogum/protocols/dogrulanmis-kaynaklar"
import { asistanYanitiCoz, speechOneki } from "@/lib/asistan/yanitCoz"
import { doktorMetniTemizle } from "@/lib/doktor/klinikMetin"
import { cozumKonus, hastaninSozunuCoz, personaIlkAdi, type HastaCozumu } from "@/lib/doktor/hastaCozumleyici"
import { dosyaPaketOnbellekli } from "@/lib/doktor/ogrenme/dosyaOnbellek"
import { adliDosyaCevabi, dosyaSoruCevap, type HastaDosyaKart } from "@/lib/doktor/hastaDosyaKart"
import { kimlikSorusunuCevapla, type KimlikCevabi } from "@/lib/doktor/kimlikSorusu"
import { aiKotaKullan, KOTA_MESAJI } from "@/lib/doktor/hizLimiti"
import { quickClassify, extractPrescriptionData } from "@/lib/asistan/intentParser"
import { executeAction, eskiEylemKarari, type ActionResult } from "@/lib/asistan/actionExecutor"
import { searchDrug, ilacBaglamMetni } from "@/lib/asistan/turkishDrugs"
import { toAddressableUser, type DoctorProfile } from "@/lib/userProfile"
import { hafizaYukle, hafizaBloguSohbet, seansIsle, ogrenmeyeDeger, sohbettenOgren, ozetGerekirseGuncelle } from "@/lib/doktor/hafiza"
import { hastaSahibiMi } from "@/lib/doktor/hastaSahipligi"
import { aktifHastaKullanilsinMi, dosyaAcmaIstegiMi, kohortSorusuMu } from "@/lib/asistan/aktifHasta"
import { aiAkis, aiCagir, girdiTokenTahmini, yanitMetni, type AiMesaj } from "@/lib/ai/cagir"
import { anilanBaskaKisi, okumaAraciCalistir, okumaAraciKapali, okumaAraciMi, OKUMA_ARACI_BLOGU, OKUMA_ARACLARI, OKUMA_TUR_TAVANI, type OkumaSonucu } from "@/lib/asistan/okumaAraclari"
import { AlanDefteri, alanlariYerineKoy, alanSozcusu, verilmeyenleriSil, type AlanRef } from "@/lib/asistan/hastaAlan"
import { asistanModelYonlendir, gecmisiKirp, netSosyalMi, sohbetKademesi, SOHBET_SAKLANAN_MESAJ } from "@/lib/ai/modeller"
import { aracTanimlari, eylemKapali, HASTA_ADI_ALANI } from "@/core/eylemler/araclar"
import { toolUseOnerileri, toolUseBloklari, oneriHazirla, type HazirOneri } from "@/core/eylemler/oneri"
import { bekleyenKomutOku, komutCevabiMi, komutNiyetiBul, randevuTamMi, type BekleyenKomut, type KomutNiyeti } from "@/lib/asistan/komutNiyeti"
import { adsiz, duz, randevuSaatiBul, randevuTarihiBul, soylenenAd, type RandevuNiyeti } from "@/lib/randevu/randevuSozu"
import { bosSaatMetni, doktorCalismaGunu } from "@/lib/randevu/bosSaatler"
import { hastaOzetiGetir } from "@/core/eylemler/hasta"
import { EYLEM_ISTEM_BLOGU } from "@/core/eylemler/istem"
import { eylemZamani, type HastaOzeti } from "@/core/eylemler/types"
import { sunucuTarihDegerleri } from "@/lib/asistan/sunucuTarihi"
import { asiKaydiSorusuMu, asiTablosuCevabi } from "@/lib/asistan/asiTablosu"
import { kayitCevabi, kayitIstegiBul, type KayitCevabi } from "@/lib/asistan/kayitTablosu"
import { asiKarnesiVerisi } from "@/lib/asi/karneSunucu"
import { ciddiUyariSozu, sesOzetMetni, UYARI_ONAY_SOZU } from "@/core/eylemler/sesKapilari"
import { bransAnahtari } from "@/lib/specialties/bransAnahtari"
import { kimlikEkrandaSozu, konusmaYap, okumaIstegiMi, SesAkisi, sesSiniriSec, SOZ_BEAT_SINIRI, sozCumleleri, sesDevamKalani } from "@/lib/asistan/konusma"
import { soruTuruBul, type SoruTuru } from "@/lib/asistan/dosyaSorgu/soruTuru"
import { kanitBlogu } from "@/lib/asistan/dosyaSorgu/kanit"
import { vizitOlcumCevabi, vizitOlcumKaniti, vizitOlcumSorusuBul } from "@/lib/asistan/dosyaSorgu/vizitOlcum"
import { dosyaSorguKuralBlogu } from "@/lib/asistan/dosyaSorgu/kurallar"
import type { DosyaHastasi, DosyaOlayi } from "@/lib/doktor/dosyaOlaylari"
import { hastaOdakTemizle } from "@/lib/asistan/hastaOdakKilidi"
import { hastaOzetiKisa } from "@/lib/doktor/hastaDosyaKisa"
import { SES_TAM_DOSYA_ISARETI, sesOzetKurali, sesTamDosyaGerekirMi, sesTamDosyaIstendiMi } from "@/lib/asistan/sesDosya"
import { takvimSorusuCoz, sesGurultusuMu, takvimTakipCoz, takvimRecantMi, sonTakvimCevabiMi, takvimSapmasiMi } from "@/lib/randevu/takvimSorusu"
import { baglamOku, takipCoz, baglamKur, baglamBlogu, niyetBul, varliklariCikar, asrOnar, type Niyet } from "@/lib/asistan/konusmaBaglami"
import { doktorunGununuOku, gunlukKonusmaMetni, gunlukOzetMetni, haftalikOzetMetni } from "@/lib/randevu/gunlukOzet"
import { bugunTz, isoGunKaydir, saatDilimiSec } from "@/lib/randevu/tarihCozumle"
import { zamanBlogu } from "@/lib/asistan/zamanBlogu"

export type Kanal = "yazi" | "ses"

/**
 * NOTYA-AYSE-GERI-00: which step of the pipeline answered the turn. Everything except `model` is a model-free
 * return. Carried on the answer (`veri.rota`) and logged once per turn, so a request that never reached Luna is
 * visible in production logs and pinned by the routing table (lib/asistan/ayseRota.test.ts).
 */
export type AyseRota = "kapsam" | "takvim" | "gurultu" | "kimlik" | "oku" | "arama" | "dosya-ac" | "hizli-kart" | "kayit" | "model"

/**
 * NOTYA-AYSE-GERI-08 (audit §9, PR 11): audit switch, like NOTYA_KORUYUCU_KAPALI. With NOTYA_ARAC_ZORLAMA_KAPALI=1 a
 * command turn sends the whole tool list with no forced tool_choice — the only way to measure how often the primary
 * model calls a tool unprompted (lib/asistan/tests/eylemDenetimi.kos.ts). Never set in production.
 */
export function aracZorlamaKapali(): boolean {
  return process.env.NOTYA_ARAC_ZORLAMA_KAPALI === "1"
}

/**
 * NOTYA-AYSE-ARAC-PARITE (2026-10-02): audit switch, like the two above. With NOTYA_HIZLI_YOL_KAPALI=1 the model-free
 * READ routers (calendar, identity, record tables, practice search sentence, quick card, evidence matcher) step
 * aside, exactly as if the doctor's phrasing had matched none of them. The turn then depends on the model and its
 * read tools alone — the way to prove a router gap is no longer a dead end, and to measure the round trip
 * (lib/asistan/aracPariteKabul.test.ts). Name resolution, the scope gate and commands are untouched. Never set in
 * production.
 */
export function hizliYolKapali(): boolean {
  return process.env.NOTYA_HIZLI_YOL_KAPALI === "1"
}

export interface AyseGirdisi {
  supabase: SupabaseClient
  doktorId: string
  /** asistan_sessions.id — iki kanalın ortak hafızası. Yoksa / başka doktorunsa yeni oturum açılır. */
  oturumId?: string | null
  mesaj: string
  kanal: Kanal
  specialty?: string
  /** Sayfanın hastası (varsa). Sahipliği burada doğrulanır. */
  patientId?: string | null
  sessionId?: string | null
  personaId?: string | null
  /** Ses: sözlü biçimin parçaları hazır oldukça (model yazarken) buraya akar. */
  sozParcasi?: (parca: string) => void
  /** NOTYA-SES-ERKEN-01: called once when the spoken cap is reached; the voice channel may close, the screen answer continues. */
  sesSiniri?: () => void
  /**
   * NOTYA-SES-DEVAM-01: the voice endpoint's view of this turn — was it cut (cap or guard timer) and what text
   * actually reached ElevenLabs. When given, the cap is silent and a cut turn stores its remainder (sesDevam).
   */
  sesDurumu?: () => { kesildi: boolean; soylenen: string }
  /** NOTYA-TAKVIM-TZ-01: doctor's IANA timezone from the client (Intl resolvedOptions) — "bugün / yarın" resolve here. Fallback TRT. */
  saatDilimi?: string | null
  /** NOTYA-SES-TUR-02 (Kaan, 2026-10-01): set when the caller can abort this turn (voice barge-in /
   * sentence merge). An aborted turn still runs to completion (no network call is cut) but its answer is
   * never written to the session record, so it can never resurface later as a stale answer on a
   * different turn or a different conversation. */
  sinyal?: AbortSignal
}

/** NOTYA-SES-DEVAM-01: asistan_sessions.active_context.sesDevam — the unspoken rest of a cut voice turn. */
export interface SesDevam {
  /** The assistant message's `zaman` (the ses-ekran turn key). */
  anahtar: string
  kalan: string
  olusturma: string
}

/** Sohbet geçmişi satırı. Sesli turlar ekrana taşınabilmek için `kanal` / `zaman` / `kartlar` da taşır; modele yalnız role + content gider. */
export interface OturumMesaji {
  role: "user" | "assistant"
  content: string
  kanal?: Kanal
  zaman?: string
  kartlar?: string[]
  hastaId?: string | null
  /** Kimlik cevabı: değer saklanmaz (content değersizdir); ekran okunurken sunucuda yeniden kurulur. */
  kimlik?: boolean
  /**
   * NOTYA-AYSE-ARAC-PARITE: the identity answer came from the model's hasta_bul call. The screen is rebuilt from the
   * sentence the tool was called with (the doctor's own wording was the gap). A question, never a value.
   */
  kimlikSorusu?: string
  /**
   * NOTYA-AYSE-ALAN-01: `content` carries identity placeholders ({{ALAN:…}}). These say which field of which patient
   * each one stands for — references, never a value. The model always gets `content` as stored; the doctor's screen
   * form is rebuilt on read (lib/asistan/hastaAlan.ts alanlariYerineKoy, doctor-scoped).
   */
  alanlar?: AlanRef[]
}

export interface AyseCevabi {
  ekran: string
  konusma: string
  kartlar: HazirOneri[]
  /** Kartların hastası; `oncekiBekleyen` bu turdan önce oturumda bekleyen kartlar (ses: eski taslağı geri çekmek için). */
  kartHastaId?: string | null
  oncekiBekleyen?: string[]
  aktifHasta: string | null
  oturumId: string | null
  rota: AyseRota
  /** /api/asistan/chat yanıtının `data` alanı — yazılı sohbetin sözleşmesi birebir. */
  veri: Record<string, unknown>
}

export type AyseSonucu =
  | { ok: true; cevap: AyseCevabi }
  /** `govde` yazılı rotanın eski hata gövdesi (biçim korunur); `soz` sesli kanalda söylenecek cümle. */
  | { ok: false; durum: number; govde: Record<string, unknown>; soz: string }

const simdi = () => new Date().toISOString()

/** NOTYA-LUNA-ARAMA-01: kuyruk bloğu — bu turda dosya yok; model dosya uydurmasın, "dosyası açık" demesin. */
export const DOSYA_YOK_BLOGU = `

[BU TURDA AÇIK HASTA DOSYASI YOK] Bu mesajda adı çözülen bir hasta yok ve sana dosya verilmedi. Bir hasta hakkında soru soruluyorsa dosyadan bilgi VERME, "dosyası açık / önümde / baktım" DEME, aşı / ilaç / lab / vizit uydurma. Mesajda bir kişi adı geçiyorsa o ad kayıtlarda BULUNAMAMIŞTIR: "<ad> adında bir hasta kayıtlarınızda bulamadım Hocam; adını ve soyadını tam söyler misiniz?" de — "dosyasını açın / seçin / açıp sorun" DEME (dosyayı sen açarsın, doktor değil). Ad geçmiyorsa hastanın adını ve soyadını iste. Hasta gerektirmeyen klinik ya da uygulama sorusuna normal cevap ver. Hasta sayısı ya da "Filtre: …" cümlesi KURMA — sayım istenmedi.`

/**
 * NOTYA-AYSE-GERI-03: kuyruk bloğu — a command with no patient resolved. The tools are offered with `hasta_adi`;
 * the model either passes the name the doctor said or asks for it. It never invents one.
 */
export const HASTASIZ_KOMUT_BLOGU = `

[KOMUT — HASTA HENÜZ BELLİ DEĞİL] Hekim bir kayıt / randevu işlemi istiyor ama bu turda dosyası açık bir hasta yok. Sana verilen araçlarda "hasta_adi" alanı var: hekim bu konuşmada hastanın adını SÖYLEDİYSE aracı çağır ve hasta_adi alanına o adı yaz (sistem adı hekimin kendi hastaları içinde arar; bulunamazsa hekime sorar). Hekim hasta adı söylemediyse araç ÇAĞIRMA; tek kısa soru sor: "Hangi hasta için Hocam?". Ad uydurma. "Hasta sayısı" ya da "Filtre:" cümlesi kurma.`

/**
 * NOTYA-AYSE-GERI-03: kuyruk bloğu — an appointment request that is not complete yet. Says what the server already
 * has and what is missing, so the model asks for exactly that and nothing else.
 */
export function randevuSoruBlogu(tur: RandevuNiyeti, tarih: string | null, saat: string | null, gunBolumu: string | null = null): string {
  const bilinen = [tarih ? `gün ${tarih}` : "", saat ? `saat ${saat}` : ""].filter(Boolean).join(", ")
  // NOTYA-AYSE-GUVENLIK-02: nothing is missing (a booking with its day and time, a move with its new time) and the
  // tool was not forced. This block used to label the booking "EKSİK BİLGİ: saat" and hand the model the question
  // "Saat kaçta Hocam?" — which it asked, with 11:00 in the doctor's sentence (action audit 2026-10-02, no. 27).
  if (randevuTamMi(tur, tarih, saat) && (tur !== "tasi" || saat)) {
    return `

[RANDEVU — BİLGİ TAM] Hekim bu randevu için ${bilinen || "gerekeni"} söyledi; sistem bunları cümleden okudu. Bunları YENİDEN SORMA ("Saat kaçta Hocam?" DEME): randevu aracını çağır. Eksik olan başka bir şey varsa (hangi hasta) yalnız onu sor.`
  }
  // A part of day without a clock time ("yarın öğleden sonra"): it is not asked again and not turned into an hour.
  const bolum = !saat && gunBolumu
    ? ` Hekim günün bölümünü söyledi (${gunBolumu}): onu yeniden sorma, kendin saate çevirme; yalnız tam saati sor.`
    : ""
  const eksik = tur === "olustur"
    ? (!tarih && !saat ? "gün ve saat" : !tarih ? "gün" : "saat")
    : "yeni gün ya da yeni saat"
  const soru = eksik === "gün ve saat" ? "Hangi gün ve saat kaçta Hocam?" : eksik === "gün" ? "Hangi gün Hocam?" : eksik === "saat" ? "Saat kaçta Hocam?" : "Hangi güne ve saate alalım Hocam?"
  return `

[RANDEVU — EKSİK BİLGİ: ${eksik}] Hekim randevu işlemi istiyor ama ${eksik} söylenmedi${bilinen ? ` (söylenen: ${bilinen})` : ""}. Boş kart hazırlama, araç ÇAĞIRMA: tek kısa soru sor ("${soru}"). Takvimi kontrol etmeyi hekime bırakma; çakışmayı kart kendisi yazar.${bolum}`
}

/** "sabah" / "öğleden sonra" / "öğle" / "akşam" in the doctor's sentence — a part of day, not a clock time. */
export function gunBolumuBul(mesaj: string): string | null {
  const n = duz(mesaj)
  return / ogleden sonra\w* /.test(n) ? "öğleden sonra" : / sabah\w* /.test(n) ? "sabah" : / ogle\w* /.test(n) ? "öğle" : / aksam\w* /.test(n) ? "akşam" : null
}

export async function ayseCevapla(g: AyseGirdisi): Promise<AyseSonucu> {
  const cevapBas = Date.now()
  const supabase = g.supabase
  const doktorId = g.doktorId
  /** The doctor's words as typed / heard — stored in the session history and shown to the model as such. */
  const hamMesaj = g.mesaj
  /** The effective question: the follow-up rewrite (NOTYA-KONUSMA-BAGLAMI-01) or the raw message. Every matcher reads this. */
  let message = hamMesaj
  const specialty = g.specialty || "genel"
  const patientId = g.patientId || null
  const ses = g.kanal === "ses"
  const soyle = (s: string) => { if (ses && g.sozParcasi && s) g.sozParcasi(`${s} `) }
  const turBaslangic = simdi()

  // HASTA-IZOLASYON-01: the patient context comes from the request — it must be this doctor's patient
  // before it is stored on the assistant session or put into the model prompt.
  if (patientId && !(await hastaSahibiMi(supabase, doktorId, String(patientId)))) {
    return { ok: false, durum: 404, govde: { success: false, error: "Hasta bulunamadı" }, soz: "Bu hastayı kayıtlarınızda bulamadım Hocam." }
  }

  // Load doctor profile for Hocam addressing — profil, tercihler ve oturum birbirinden bağımsız: paralel okunur.
  const [{ data: doctorRow }, { data: prefs }, oturumOkuma] = await Promise.all([
    supabase.from("users").select("*").eq("id", doktorId).maybeSingle(),
    supabase.from("doctor_preferences").select("*").eq("doctor_id", doktorId).single(),
    g.oturumId
      ? supabase.from("asistan_sessions").select("*").eq("id", g.oturumId).eq("doctor_id", doktorId).single()
      : Promise.resolve({ data: null }),
  ])
  const doctorProfile = toAddressableUser(doctorRow as DoctorProfile | null)
  // DAH-/KD-/DERM-PROMPTS-LOCK + ASISTAN-PERSONA-BRANS: users.specialty drives the branch lock and the default colleague
  const hekimBransi = (doctorRow as { specialty?: string } | null)?.specialty

  // Load or create asistan session
  let asistanSession: Record<string, unknown> | null = (oturumOkuma as { data: Record<string, unknown> | null }).data
  if (!asistanSession) {
    asistanSession = await asistanOturumuAc(supabase, { doktorId, personaId: g.personaId, specialty, hekimBransi, patientId, sessionId: g.sessionId })
  }

  const baglam = (asistanSession?.active_context as Record<string, unknown>) || {}
  const istenenPersona = g.personaId && PERSONAS[g.personaId as PersonaId] ? (g.personaId as PersonaId) : null
  const kayitliPersona = (asistanSession?.persona_id as PersonaId) || null
  // Sekme değişince aynı oturum kalırsa eski meslektaşın geçmişi ve hastası yeni sesin ağzından konuşuyordu.
  const personaDegisti = Boolean(istenenPersona && kayitliPersona && istenenPersona !== kayitliPersona)
  const personaId = istenenPersona || kayitliPersona || varsayilanPersonaId(specialty, hekimBransi)
  const persona = PERSONAS[personaId] || PERSONAS[varsayilanPersonaId(specialty, hekimBransi)]
  if (!persona) {
    return { ok: false, durum: 500, govde: { error: "Uzman persona bulunamadı" }, soz: "Şu an cevap veremiyorum Hocam." }
  }

  const contextPatientId = personaDegisti ? (patientId || null) : (baglam.currentPatientId || patientId)
  const messages: OturumMesaji[] = personaDegisti ? [] : ((asistanSession?.messages as OturumMesaji[]) || [])
  const oturumId = (asistanSession?.id as string) || null
  const saatDilimi = saatDilimiSec(g.saatDilimi)

  // NOTYA-KONUSMA-BAGLAMI-01 (Kaan, 2026-09-30): deterministic continuity. The previous turn's intent + entities live
  // in active_context.konusma; an elliptical follow-up ("peki yarın?", "dozu?", "kimler?", "ya Rıdvan'ın?") is rewritten
  // into the full question BEFORE any matcher runs, so calendar / chart / search / model all see the same intent.
  // A persona switch drops the context; so does 10 minutes of silence or a full question (lib/asistan/konusmaBaglami.ts).
  let konusmaOnceki = personaDegisti ? null : baglamOku(baglam.konusma)
  if (konusmaOnceki) {
    // The session's open patient (a page switch is the more recent explicit signal) is the patient a follow-up
    // inherits — never a name the record kept from before the switch.
    const aktifId = contextPatientId ? String(contextPatientId) : null
    const v = konusmaOnceki.sonVarliklar
    if (aktifId && v.hastaId !== aktifId) {
      const ad = baglam.currentPatientId && String(baglam.currentPatientId) === aktifId && baglam.patientName ? String(baglam.patientName) : null
      konusmaOnceki = { ...konusmaOnceki, sonVarliklar: { ...v, hastaId: aktifId, hastaAd: ad } }
    }
  }
  // NOTYA-KONUSMA-BAGLAMI-06: the closed-vocabulary ASR repair ("randevo" → randevu, "reşete" → reçete) also applies
  // to a first turn with no context; date-word repair needs a calendar turn behind it and lives in takipCoz.
  const onarim = asrOnar(hamMesaj, false)
  if (onarim.onarilan.length) {
    message = onarim.mesaj
    console.info("[asistan/chat] asr onarım", { onarilan: onarim.onarilan })
  }
  // NOTYA-AYSE-GERI-03 (audit §4.4): a COMMAND ("alerjisini ekle", "randevusunu perşembeye al", "Ventolini kes")
  // goes to Luna and its tools. It is decided once, here, on the doctor's own words, and every model-free router
  // below steps aside for it: the calendar reader, the identity answer, the quick card, the search sentence and the
  // deterministic chart-open. A command is never an elliptical follow-up either — the rewriter is skipped, so its
  // date-word repair cannot turn a patient name into a weekday ("Ali Yılmaz için randevu oluştur" → "Salı …").
  //
  // A command that could not be finished in one sentence continues: the pending command (tool, day, time said so
  // far) is kept in the session, and a short answer to Ayşe's question ("Umutcan Türkoğlu", "Yarın", "14:30") is the
  // same command, one piece closer — it carries no verb of its own (lib/asistan/komutNiyeti.ts, BekleyenKomut).
  const bekleyenKomut = personaDegisti ? null : bekleyenKomutOku(baglam.bekleyenKomut)
  const komutSimdi = komutNiyetiBul(onarim.mesaj, { saatDilimi })
  const komutDevami = !komutSimdi && bekleyenKomut && komutCevabiMi(onarim.mesaj) ? bekleyenKomut : null
  const komut: KomutNiyeti | null = komutSimdi ?? (komutDevami ? { arac: komutDevami.arac, zorla: false, randevu: komutDevami.randevu } : null)
  const takip = konusmaOnceki && !komut ? takipCoz(hamMesaj, konusmaOnceki, { tz: saatDilimi }) : null
  if (takip) {
    message = takip.soru
    console.info("[asistan/chat] takip", { miras: takip.miras, niyet: takip.niyet })
  }
  /** Intent of this turn as the deterministic paths decide it; the model path falls back to the intent words. */
  let turNiyeti: Niyet | null = null

  /** Tek yazma noktası: geçmiş + (varsa) çözülen hasta + (varsa) bekleyen kart listesi. */
  const oturumuYaz = async (asistanSozu: string, ek: { hasta?: { id: string; ad: string } | null; kartlar?: string[]; kartHastaId?: string | null; kimlik?: boolean; kimlikSorusu?: string; bekleyen?: string[]; sesDevamKalan?: string; bekleyenKomut?: BekleyenKomut | null; alanlar?: AlanRef[] } = {}) => {
    // NOTYA-SES-TUR-02: this turn was cancelled (barge-in / sentence merge) -- never let its answer reach
    // the session record, where a later poll or follow-up turn could surface it as a fresh answer.
    if (g.sinyal?.aborted) return
    const kullanici: OturumMesaji = ses ? { role: "user", content: hamMesaj, kanal: "ses", zaman: simdi() } : { role: "user", content: hamMesaj }
    const asistanZamani = simdi()
    const asistan: OturumMesaji = ses
      ? {
          role: "assistant", content: asistanSozu, kanal: "ses", zaman: asistanZamani,
          ...(ek.kartlar?.length ? { kartlar: ek.kartlar, hastaId: ek.kartHastaId ?? null } : {}),
          ...(ek.kimlik ? { kimlik: true, hastaId: ek.hasta?.id ?? (contextPatientId ? String(contextPatientId) : null), ...(ek.kimlikSorusu ? { kimlikSorusu: ek.kimlikSorusu } : {}) } : {}),
          ...(ek.alanlar?.length ? { alanlar: ek.alanlar } : {}),
        }
      : { role: "assistant", content: asistanSozu, ...(ek.alanlar?.length ? { alanlar: ek.alanlar } : {}) }
    // NOTYA-SES-DEVAM-01: a new real doctor turn drops the previous turn's unspoken remainder.
    // NOTYA-AYSE-GERI-03: a pending command lives only as long as a turn writes it back.
    const { sesDevam: eskiDevam, bekleyenKomut: eskiBekleyenKomut, currentPatientId, patientName, ...geriBaglam } = baglam
    const oncekiBaglam = personaDegisti ? geriBaglam : { ...geriBaglam, ...(currentPatientId ? { currentPatientId, patientName } : {}) }
    const sesDevam: SesDevam | null = ses && ek.sesDevamKalan ? { anahtar: asistanZamani, kalan: ek.sesDevamKalan, olusturma: simdi() } : null
    // NOTYA-SAYFA-HASTA-01: the doctor opened another patient's page while this turn ran (a voice turn can take
    // 30 s) — that page switch is the more recent explicit signal; this write must not put the old focus back.
    let sayfaOdagi: Record<string, unknown> | null = null
    {
      const { data: taze } = await supabase.from("asistan_sessions").select("active_context").eq("id", oturumId).eq("doctor_id", doktorId).maybeSingle()
      const t = ((taze as { active_context?: Record<string, unknown> | null } | null)?.active_context || {}) as Record<string, unknown>
      if (t.odakKaynak === "sayfa" && t.currentPatientId && String(t.odakZaman || "") > turBaslangic) {
        sayfaOdagi = { currentPatientId: t.currentPatientId, patientName: t.patientName ?? null, odakKaynak: "sayfa", odakZaman: t.odakZaman }
      }
    }
    // NOTYA-KONUSMA-BAGLAMI-01: the record for the next turn — the effective (rewritten) question, the entities it
    // carried and the patient it ended on. Written on every turn, deterministic and model paths alike.
    const konusmaHastasi = ek.hasta
      ?? (sayfaOdagi?.currentPatientId ? { id: String(sayfaOdagi.currentPatientId), ad: String(sayfaOdagi.patientName || "") } : null)
      ?? (!personaDegisti && currentPatientId ? { id: String(currentPatientId), ad: String(patientName || "") } : null)
    const konusma = baglamKur({
      soru: message,
      cevap: asistanSozu,
      niyet: turNiyeti ?? takip?.niyet ?? niyetBul(message) ?? (konusmaOnceki && takip ? konusmaOnceki.sonNiyet : "genel"),
      varliklar: { ...(takip?.varliklar || {}), ...varliklariCikar(message, { tz: saatDilimi }) },
      hasta: konusmaHastasi && konusmaHastasi.ad ? konusmaHastasi : konusmaHastasi ? { id: konusmaHastasi.id, ad: takip?.varliklar.hastaAd || konusmaOnceki?.sonVarliklar.hastaAd || "" } : null,
    })
    const yeniBaglam = {
      ...oncekiBaglam,
      ...(personaDegisti && !ek.hasta && !sayfaOdagi ? { currentPatientId: null, patientName: null } : {}),
      ...(ek.hasta ? { currentPatientId: ek.hasta.id, patientName: ek.hasta.ad, odakKaynak: "soz", odakZaman: asistanZamani } : {}),
      ...(ek.bekleyen ? { bekleyenOneriler: ek.bekleyen } : {}),
      ...(ek.bekleyenKomut && !personaDegisti ? { bekleyenKomut: ek.bekleyenKomut } : {}),
      ...(sesDevam && !sayfaOdagi ? { sesDevam } : {}),
      ...(sayfaOdagi || {}),
      konusma,
    }
    await supabase.from("asistan_sessions").update({
      messages: [...messages, kullanici, asistan].slice(-SOHBET_SAKLANAN_MESAJ),
      ...(personaDegisti ? { persona_id: personaId } : {}),
      ...(sayfaOdagi ? { patient_id: sayfaOdagi.currentPatientId } : ek.hasta ? { patient_id: ek.hasta.id } : personaDegisti ? { patient_id: null } : {}),
      active_context: yeniBaglam,
    }).eq("id", oturumId)
  }

  const rotaYaz = (rota: AyseRota, ek: Record<string, unknown> = {}) => console.info("[asistan/chat] rota", { rota, kanal: g.kanal, ...ek })
  const sade = (rota: AyseRota, ekran: string, konusma: string, aktifHasta: string | null, veriEk: Record<string, unknown> = {}): AyseSonucu => {
    rotaYaz(rota)
    return {
      ok: true,
      cevap: {
        ekran, konusma, kartlar: [], aktifHasta, oturumId, rota,
        veri: {
          eylemOnerileri: [], eylemYonlendirme: null, eylemHastasi: null, speech: ekran, proactiveWarning: null,
          action: null, actionResult: null, asistanSessionId: oturumId, aktifHasta, personaId, personaName: persona.name, rota, ...veriEk,
        },
      },
    }
  }

  // NOTYA-KAPSAM-01 (Kaan, 2026-10-01): Ayse answers only what Notya is for. A clearly off-topic ask (car / weather /
  // sports / finance / recipe / code ...) with no in-scope signal gets ONE fixed refusal: no patient lookup, no model,
  // no learning, no card, and the same string on screen and in voice. A same-topic follow-up right after a refusal
  // (peki hangisi daha iyi?) is refused too. Rules and word lists: lib/asistan/kapsamKilidi.ts.
  // NOTYA-KAPSAM-05 (2026-10-01): "Bugün İstanbul'da hava yağışlı mı?" answered "Bugün 0 hasta. Filtre: bugün · Şehir."
  // The gate now runs on follow-up turns too (a clear off-topic pattern is never a follow-up of a patient question),
  // and an unsure turn (off-topic hint, no in-scope signal) gets one fixed clarifying question — no patient tool, no
  // model. The clarifying question is only for a fresh turn: an in-scope follow-up ("peki yarın?") keeps its context.
  const oncekiAsistan = [...messages].reverse().find((m) => m.role === 'assistant')
  const oncekiRed = kapsamRedMi(oncekiAsistan?.content)
  // NOTYA-KAPSAM-06: a message that names one of this doctor's patients is never refused (name-only, doctor-scoped
  // lookup, run only when the model-free verdict is not in-scope).
  const kapsam = await kapsamKarariHastayla(supabase, doktorId, hamMesaj, { oncekiRed })
  if (kapsam === 'disi' || (kapsam === 'belirsiz' && !takip)) {
    const sabit = kapsam === 'disi' ? KAPSAM_RED : KAPSAM_SORU
    console.info('[asistan/chat] kapsam', { karar: kapsam, kanal: g.kanal, oncekiRed })
    soyle(sabit)
    await oturumuYaz(sabit, {})
    return sade("kapsam", sabit, sabit, baglam.patientName ? String(baglam.patientName) : null)
  }
  // NOTYA-SES-TAKVIM-01: clinic day/slot is a doctor-scoped lookup — no dossier, no model.
  // Voice was waiting on the open patient's full file, then the socket dropped before TTS.
  const sonTakvimAsistan = [...messages].reverse().find((m) => m.role === "assistant" && sonTakvimCevabiMi(m.content))
  // NOTYA-AYSE-ARAC-PARITE: the read routers below are a FAST PATH, not gatekeepers — what they do not answer goes to
  // the model with its read tools. `hizliYol` is false only under the audit switch.
  const hizliYol = !hizliYolKapali()
  // A command is never a calendar READ: "yarın 14:00 için kontrol randevusu oluştur" used to get that day's schedule.
  const takvim = komut || !hizliYol
    ? null
    : (takvimSorusuCoz(message, { saatDilimi }) || takvimTakipCoz(message, sonTakvimAsistan?.content, { saatDilimi }))
  if (!takvim && sesGurultusuMu(message)) {
    // ASR pause ("...") after a true calendar line must not reach the model — it recants.
    return sade("gurultu", "", "", baglam.patientName ? String(baglam.patientName) : null)
  }
  if (takvim) turNiyeti = "takvim"
  if (takvim?.aralik) {
    // NOTYA-AYSE-100 T1: "bu hafta / haftaya" — seven day reads, one summary, no model.
    try {
      const { bas, bit } = takvim.aralik
      const gunler: string[] = []
      for (let g = bas; g <= bit && gunler.length < 7; g = isoGunKaydir(g, 1)) gunler.push(g)
      const okunan = await Promise.all(gunler.map(async (tarih) => ({ tarih, satirlar: await doktorunGununuOku(supabase, doktorId, tarih, saatDilimi) })))
      const hafta = haftalikOzetMetni({ bas, bit, gunler: okunan, tz: saatDilimi })
      soyle(hafta.konusma)
      await oturumuYaz(hafta.metin, { bekleyenKomut })
      return sade("takvim", hafta.metin, hafta.konusma, baglam.patientName ? String(baglam.patientName) : null)
    } catch (e) {
      console.error("[asistan/chat] takvim hafta", e instanceof Error ? e.message : String(e))
    }
  } else if (takvim) {
    try {
      const satirlar = await doktorunGununuOku(supabase, doktorId, takvim.tarih, saatDilimi)
      if (takvim.bosluk) {
        // NOTYA-AYSE-GERI-03: free slots of the day — working hours minus the appointments, no model.
        const gun = await doktorCalismaGunu(supabase, doktorId, takvim.tarih)
        const bos = bosSaatMetni({ tarih: takvim.tarih, satirlar, gun, tz: saatDilimi })
        soyle(bos.konusma)
        await oturumuYaz(bos.metin, { bekleyenKomut })
        return sade("takvim", bos.metin, bos.konusma, baglam.patientName ? String(baglam.patientName) : null)
      }
      const ozet = gunlukOzetMetni({
        tarih: takvim.tarih,
        satirlar,
        istenenSaat: takvim.saat,
        istenenSureDk: 20,
      })
      const konusma = gunlukKonusmaMetni({
        tarih: takvim.tarih,
        satirlar,
        istenenSaat: takvim.saat,
        cakisiyor: ozet.cakisiyor,
        cakisan: ozet.cakisan,
        tz: saatDilimi,
      })
      soyle(konusma)
      // A calendar look-up in the middle of a pending command ("yarın 15:00 boş mu?") does not end the command.
      await oturumuYaz(ozet.metin, { bekleyenKomut })
      return sade("takvim", ozet.metin, konusma, baglam.patientName ? String(baglam.patientName) : null)
    } catch (e) {
      console.error("[asistan/chat] takvim", e instanceof Error ? e.message : String(e))
    }
  }

  // Quick classify intent for faster response
  const quickIntent = quickClassify(message)
  // The model sees the doctor's words AND the completed question, so the answer addresses what was meant.
  let augmentedMessage = takip ? `${hamMesaj}\n\n[DOKTORUN KASTI — konuşma bağlamından tamamlandı: ${takip.soru}]` : message

  // Add drug context if prescription intent
  if (quickIntent === "ADD_PRESCRIPTION") {
    const prescData = extractPrescriptionData(message)
    if (prescData.drugName) {
      const drugs = searchDrug(String(prescData.drugName))
      if (drugs.length > 0) {
        // NOTYA-EYLEM-28: entries are now full KÜB-sourced records; JSON.stringify of one would
        // cost more prompt tokens than the answer is worth. A compact, source-cited block instead.
        augmentedMessage += `

[SİSTEM BAĞLAMI: İlaç bilgisi]
${ilacBaglamMetni(drugs[0])}`
      }
    }
  }

  // NOTYA-KONSULT-02: "klinik meslektaş" tek asistanda — doktor sohbette bir hastadan
  // bahsettiğinde (adıyla ya da "son hastam" diyerek) hastanın TAM dosyası bağlama eklenir;
  // ayrı ekran/buton gerekmez. Çözülen hasta oturum bağlamına yazılır ki takip soruları
  // ("peki ilaçları?") doğal akışta cevaplansın. Basitlik ilkesi: tek asistan, tek konuşma.
  let dosyaEk = ""
  let dosyaGovde = ""
  let dosyaTur = ""
  let odakDosyaMetni = ""
  // NOTYA-AYSE-STANDART-01 + odak kilidi uyumu: kanıt yolu (İlk 10) açıkken cevap takvimdeki eksik aşıları ADIYLA sayar
  // ("KKK — kayıt yok"); bu uydurma liste değildir, kilit bu turda aşı-listesi kuralını uygulamaz.
  let kanitYoluAktif = false
  let dosyaOnbellekten = false
  let odakHastaAdi = ""
  // NOTYA-MODEL-LUNA-02: dosyanın yalnız hasta verisi (kurallar değil) — güvenlik sinyali taraması için (gebe, warfarin …).
  let dosyaGuvenlikMetni = ""
  let cozulenHasta: { id: string; ad: string } | null = null
  let kesinDosyaCevap: string | null = null
  let aramaCevabi: string | null = null
  let aramaRota: AyseRota = "arama"
  let cozum: HastaCozumu | null = null
  /** The name of a person the sentence is about who is not among this doctor's patients (wrong-patient guard). */
  let baskaKisiAnildi: string | null = null
  /** The patient was resolved from a name in THIS sentence (not the open chart). */
  let adlaCozuldu = false
  /** NOTYA-AYSE-GERI-06: the full chart body of a voice turn that was sent the short one (empty otherwise). */
  let sesTamGovde = ""
  /** NOTYA-AYSE-GERI-05: a record shown from stored values (vaccine table, anthropometrics, exam summaries). */
  let kayitCevap: KayitCevabi | null = null
  let kayitNiyeti: Niyet = "hasta-dosya"
  /** NOTYA-DANIS-OLCUM: the question evaluates one exam's measurement (evidence path, not the quick card). */
  let olcumDegerlendirmesi = false
  // NOTYA-BETA-0925: kimlik / iletişim sorusu (anne-baba adı, veli, telefon, e-posta, adres, doğum yeri/tarihi)
  // sunucuda, modelsiz cevaplanır. Değerler yalnız bu yanıtın ekran metnindedir; saklanan geçmişe (sonraki
  // turlarda modele giden) değersiz metin yazılır — VELI-YASAL-ONAM kuralı korunur.
  let kimlikCevabi: KimlikCevabi | null = null
  if (!komut && hizliYol) {
    try {
      kimlikCevabi = await kimlikSorusunuCevapla(supabase, doktorId, String(message || ""), contextPatientId ? String(contextPatientId) : null)
    } catch (e) { console.error("[asistan/chat] kimlik cevabı", e instanceof Error ? e.message : String(e)) }
  }
  if (kimlikCevabi) {
    const kimlikHastasi = kimlikCevabi.hasta
    turNiyeti = "hasta-dosya"
    await oturumuYaz(kimlikCevabi.model, { hasta: kimlikHastasi, kimlik: true })
    const konusma = kimlikSozu(kimlikCevabi)
    soyle(konusma)
    return sade("kimlik", kimlikCevabi.ekran, konusma, kimlikHastasi?.ad || null)
  }
  // NOTYA-SES-OKU-01: "bana anlat / devamını oku" — read the last screen answer aloud, uncapped, no model.
  if (ses && okumaIstegiMi(String(message || ""))) {
    const sonEkran = [...messages].reverse().find((m) => m.role === "assistant" && String(m.content || "").trim())
    if (sonEkran) {
      // Screen text is already the cleaned, doctor-visible answer. NOTYA-AYSE-ALAN-01: a stored answer keeps its
      // identity placeholders; a sentence with one is not read — the value is on screen.
      const tam = konusmaYap(String(sonEkran.content), alanSozcusu(null), { sinirsiz: true })
      const okuma = tam || "Ekranda okunacak bir cevap bulamadım Hocam."
      soyle(okuma)
      const ekranNotu = "Ekrandaki cevabı sesli okudum Hocam."
      await oturumuYaz(ekranNotu, {})
      return sade("oku", ekranNotu, okuma, baglam.patientName ? String(baglam.patientName) : null)
    }
  }

  try {
    // NOTYA-TEK-BEYIN (hız): takip sorusunda aktif hastanın dosyası, mesajdaki hasta çözülürken paralel derlenir;
    // mesaj başka bir hastayı adlandırırsa bu derleme kullanılmaz (doktora kapsanmış bir okuma — sızıntı değil).
    const aktifOnceden = contextPatientId ? String(contextPatientId) : null
    const aktifPaketSozu = aktifOnceden ? dosyaPaketOnbellekli(supabase, doktorId, aktifOnceden).catch(() => null) : null
    const mesajMetni = String(message || "")
    // NOTYA-AYSE-GERI-01: with a chart open, a question that is not an explicit many-patient or calendar question is
    // about that chart — the all-patients search is not even run for it (a name in the message still wins).
    const acikDosyaSorusu = Boolean(aktifOnceden) && !takvimSorusuCoz(mesajMetni, { saatDilimi }) && !kohortSorusuMu(mesajMetni)
    cozum = await hastaninSozunuCoz(supabase, doktorId, message, { tz: saatDilimi, kohortsuz: acikDosyaSorusu || !hizliYol, hitapAdi: personaIlkAdi(persona.name) })
    adlaCozuldu = cozum.tur === "tek"
    // NOTYA-AKTIF-HASTA-01 (Kaan kararı 2026-09-29, 09-25 kuralı geri geldi): açık hasta — bu oturumda adla açılan
    // (odakKaynak 'soz') YA DA doktorun açık sayfası (NOTYA-SAYFA-HASTA-01, 'sayfa') — adsız soruyu cevaplar; arama
    // değil. Adla bulunan hasta kazanır; takvim / çok-hasta sorusu dosya bağlamaz (lib/asistan/aktifHasta.ts).
    // NOTYA-AYSE-GERI-03 (wrong-patient guard): the sentence names a person as the one it is about ("Ali Yılmaz için
    // randevu oluştur", "Zeynep Kara'nın alerjisini ekle") and that name is not among this doctor's patients. The
    // open chart is NOT a substitute for the person who was named — binding it would prepare Ali's appointment on
    // the open patient's card. The turn carries no patient; Ayşe says the name was not found. A name that shares a
    // part with the open patient's own name (a garbled surname) still means the open patient.
    if (cozum.tur === "yok" && !(cozum as { sayiMetin?: string }).sayiMetin) {
      baskaKisiAnildi = anilanBaskaKisi(onarim.mesaj, aktifOnceden && baglam.patientName ? String(baglam.patientName) : null)
    }
    // NOTYA-SES-YARIM-01: the name the doctor said matches too many patients to list — Ayşe asks for the surname;
    // the open patient must not answer a question that named someone else.
    const adBelirsiz = cozum.tur === "yok" && Boolean(cozum.cokAday)
    const aktifeDon = !baskaKisiAnildi && !adBelirsiz && aktifHastaKullanilsinMi({
      aktifHastaVar: Boolean(aktifOnceden),
      cozumTur: cozum.tur,
      aramaSonucu: Boolean((cozum as { sayiMetin?: string }).sayiMetin),
      mesaj: mesajMetni,
    })
    if (aktifeDon && aktifOnceden && cozum.tur !== "tek" && (await hastaSahibiMi(supabase, doktorId, aktifOnceden))) {
      // HASTA-IZOLASYON-01: the focus id is re-checked against this doctor before it becomes the chart.
      const aktifAdi = baglam.currentPatientId && String(baglam.currentPatientId) === aktifOnceden && baglam.patientName ? String(baglam.patientName) : ""
      cozum = { tur: "tek", patientId: aktifOnceden, ad: aktifAdi }
    }
    // NOTYA-AYSE-GERI-05 (Dr. Gökhan): the RECORD on screen — the vaccine record as a table, anthropometrics as a
    // table (one exam, a series, all exams), exam summaries for several or all exams. Built from stored values
    // only, no model; a table on screen and a short spoken line. The doctor's own words count as well as the
    // follow-up rewrite (which turns a bare "aşıları?" into the evaluation question "… aşıları tam mı?").
    const asiTabloIstegi = !komut && hizliYol && (asiKaydiSorusuMu(hamMesaj) || asiKaydiSorusuMu(mesajMetni))
    const kayitIstegi = komut || asiTabloIstegi || !hizliYol ? null : (kayitIstegiBul(hamMesaj) ?? kayitIstegiBul(mesajMetni))
    // NOTYA-DANIS-OLCUM (Dr. Gökhan, 2026-10-02): the measurement of ONE named exam ("12 aylık muayenesine geldiğinde kaç
    // kiloydu", "son kontrolde tansiyonu") or a series the table above does not cover ("kilo gelişimi", "tansiyon
    // seyri"). Before, the quick card answered these with the LATEST measurement. Same query as the Danış panel
    // (dosyaSorgu/vizitOlcum): stored values only, with unit, date and source; no model. An evaluation ("… normal
    // miydi") or another question that leans on the measurement ("… kilosuna göre hangi mama önerilmişti") is not
    // answered here — it goes to the evidence path below with that exam's measurement in the evidence.
    const olcumSorusuHam = komut || asiTabloIstegi || !hizliYol ? null : (vizitOlcumSorusuBul(hamMesaj) ?? vizitOlcumSorusuBul(mesajMetni))
    olcumDegerlendirmesi = Boolean(olcumSorusuHam && !olcumSorusuHam.kesin)
    // A named exam is more specific than the all-exams table; otherwise the table keeps its requests.
    const olcumSorusu = olcumSorusuHam?.kesin && (olcumSorusuHam.hedef.tip === "vizit" || !kayitIstegi) ? olcumSorusuHam : null
    if (cozum.tur === "tek" && !cozum.cevap && (asiTabloIstegi || kayitIstegi || olcumSorusu)) {
      try {
        // HASTA-IZOLASYON-01: the id is the resolver's (doctor-scoped) or the re-checked open patient; the karne read
        // and the chart package narrow every query by doctor AND patient again.
        if (asiTabloIstegi) {
          const karne = await asiKarnesiVerisi(supabase, doktorId, cozum.patientId, bugunTz(saatDilimi))
          const ad = cozum.ad || karne.hasta.adSoyad || "Hasta"
          cozulenHasta = { id: cozum.patientId, ad }
          kayitCevap = asiTablosuCevabi(ad, karne)
          kayitNiyeti = "asi"
        } else if (olcumSorusu || kayitIstegi) {
          const paket = cozum.patientId === aktifOnceden && aktifPaketSozu ? await aktifPaketSozu : await dosyaPaketOnbellekli(supabase, doktorId, cozum.patientId)
          if (paket) {
            const ad = cozum.ad || paket.ad || "Hasta"
            cozulenHasta = { id: cozum.patientId, ad }
            if (olcumSorusu) {
              // HASTA-IZOLASYON-01: the events are the doctor-scoped chart package of the resolved patient.
              kayitCevap = vizitOlcumCevabi(vizitOlcumKaniti(olcumSorusu, (paket.olaylar || []) as DosyaOlayi[], { dogumIso: (paket.sorguHasta as DosyaHastasi | undefined)?.dogumIso ?? null }), ad)
              kayitNiyeti = "buyume"
            } else if (kayitIstegi) {
              kayitCevap = kayitCevabi(kayitIstegi, (paket.olaylar || []) as DosyaOlayi[], ad)
              kayitNiyeti = kayitIstegi.tur === "olcum" ? "buyume" : "muayene"
            }
          }
        }
      } catch (e) {
        console.error("[asistan/chat] kayıt tablosu", e instanceof Error ? e.message : String(e))
      }
    }
    // A command is never the deterministic "X dosyası açık" answer: "… dosyasına fıstık alerjisi ekle" needs the chart AND the tool.
    const dosyaIstegi = !komut && !kayitCevap && dosyaAcmaIstegiMi(mesajMetni)
    // "Which of these patients?" is name resolution and always asked; the search / who-answer sentence is a read router.
    const hangiHastaSorusu = cozum.tur === "coklu" || (cozum.tur === "yok" && Boolean(cozum.cokAday))
    const konus = aktifeDon || (!hizliYol && !hangiHastaSorusu) ? null : cozumKonus(cozum)
    if (kayitCevap) {
      // answered below, before any model call
    } else if (konus) {
      aramaCevabi = konus
      // NOTYA-AYSE-100 S2: a who-answer ("Son gördüğünüz hasta: X") makes X the open patient for the follow-up.
      if (cozum.tur === "tek" && cozum.cevap) cozulenHasta = { id: cozum.patientId, ad: cozum.ad }
    } else if (cozum.tur === "yok" && dosyaIstegi) {
      // Never "dosyası açık" without a resolved patient.
      aramaCevabi = "Bu isimde bir hasta bulamadım Hocam; adını ve soyadını tam söyler misiniz?"
    } else if (cozum.tur === "tek" && dosyaIstegi) {
      // Deterministic open: the chart becomes the session's active patient; follow-ups load it from cache.
      cozulenHasta = { id: cozum.patientId, ad: cozum.ad }
      aramaRota = "dosya-ac"
      aramaCevabi = `${cozum.ad} dosyası açık Hocam. Ne sormak istersiniz?`
    } else if (cozum.tur === "tek") {
        // NOTYA-DANIS-OLCUM: an evaluation of one exam's measurement ("12 aylık muayenesinde kilosu normal miydi") is a
        // growth-evidence question even when no canonical sentence matches — otherwise the quick card answered it
        // with the latest measurement.
        const soruTuru: SoruTuru | null = !hizliYol ? null : soruTuruBul(String(message || "")) ?? (olcumDegerlendirmesi ? "buyume" : null)
        const paket = cozum.patientId === aktifOnceden && aktifPaketSozu ? await aktifPaketSozu : await dosyaPaketOnbellekli(supabase, doktorId, cozum.patientId)
        const sorgu = paket && soruTuru && paket.sorguHasta
          ? { olaylar: paket.olaylar as DosyaOlayi[], hasta: paket.sorguHasta as DosyaHastasi }
          : null
        kanitYoluAktif = Boolean(soruTuru && sorgu)
        if (paket) {
          dosyaOnbellekten = Boolean(paket.onbellekten)
          const aktifAd = cozum.ad || paket.ad || "aktif hasta"
          cozulenHasta = { id: cozum.patientId, ad: aktifAd }
          odakHastaAdi = aktifAd
          odakDosyaMetni = paket.metin || ""
          // NOTYA-AYSE-GERI-03: the quick card answers single-fact QUESTIONS. "Penisilin alerjisini ekle" is a command —
          // it used to be answered "Dosyada alerji: kayıt yok." and the tool was never offered.
          const kesinHam = sorgu || komut ? null : dosyaSoruCevap(String(message || ""), paket.kart as HastaDosyaKart)
          kesinDosyaCevap = kesinHam && hizliYol ? adliDosyaCevabi(aktifAd, kesinHam) : null
          const kesinBlok = kesinDosyaCevap
            ? `\n[KESİN DOSYA CEVABI — bu cümleyi AYNEN söyle, dosyada yoksa uydurma]: ${kesinDosyaCevap}`
            : ""
          dosyaGuvenlikMetni = String(paket.metin || "")
          const sesOzeti = ses && (Boolean(soruTuru) || !sesTamDosyaGerekirMi(String(message || "")))
          const tamGovde = `\n\n=== AKTİF HASTA DOSYASI: ${aktifAd} ===\n${paket.metin}\n=== DOSYA SONU ===\n[KURALLAR: Bu hasta hakkındaki her soruda YALNIZCA yukarıdaki dosyaya ve HIZLI KART'a dayan; her kesin cümleye hastanın adıyla ("${aktifAd}") başla; aşı / ilaç / lab listesini yalnız bu bloktan kur, sohbet geçmişindeki listeden ya da başka hastadan kurma; aşı tablosu ile vizit notları çelişirse ikisini de adıyla söyle; ASLA "uydurdum" / "dayanağı yok" deme; dosyada olmayan bilgiyi uydurma, "dosyada bu bilgi yok Hocam" de. Bu bloktan sonra KESİN DOSYA CEVABI varsa o cümleyi AYNEN söyle. Vizit özetleri yoğun ve yaklaşık 1 dakikada okunur uzunlukta olsun; "kaçıncı ziyaret" sorulursa toplam vizit sayısını ve tarih aralığını söyle. Doktor yeni bir ilaçtan bahsederse hastanın sürekli ilaçlarıyla olası etkileşimi KENDİLİĞİNDEN kontrol et; risk varsa "Hocam, hasta şu an X kullanıyor; Y ile ... riski olabilir" formatında uyar. Kritik dosya bilgilerini (alerji, kronik hastalık, önceki kritik bulgu) yeri geldiğinde kendiliğinden hatırlat. Nihai klinik karar ve sorumluluk doktorundur.]`
          dosyaGovde = sesOzeti
            ? `\n\n=== AKTİF HASTA DOSYASI: ${aktifAd} ===\n${hastaOzetiKisa(paket)}\n=== DOSYA SONU ===\n${sesOzetKurali(aktifAd)}`
            : tamGovde
          // NOTYA-AYSE-GERI-06: kept for the server-side retry when the short chart turns out not to hold the answer.
          if (sesOzeti) sesTamGovde = tamGovde
          dosyaTur = kesinBlok
          if (sorgu && soruTuru) {
            dosyaTur += `${dosyaSorguKuralBlogu(aktifAd)}\n${kanitBlogu(soruTuru, sorgu.olaylar, sorgu.hasta, { mesaj: String(message || "") })}`
          }
          dosyaEk = dosyaGovde + dosyaTur
        }
    }
  } catch (e) {
    // Dosya bağlamı kritik değil — normal akış sürer; ama sessiz kayıp "hasta yok" cevabı üretir, görünür olsun.
    console.warn("[asistan/chat] dosya bağlamı kurulamadı", e instanceof Error ? e.message : String(e))
  }

  if (kayitCevap) {
    turNiyeti = kayitNiyeti
    await oturumuYaz(kayitCevap.ekran, { hasta: cozulenHasta })
    soyle(kayitCevap.konusma)
    return sade("kayit", kayitCevap.ekran, kayitCevap.konusma, cozulenHasta?.ad || null)
  }

  // A command skips the model-free answers — except the "which of these patients?" question: an ambiguous name must
  // be settled before any card is prepared (docs §2: ambiguous → ask, no card), and the open chart is no stand-in.
  const hangiHasta = Boolean(aramaCevabi) && (cozum?.tur === "coklu" || (cozum?.tur === "yok" && Boolean(cozum.cokAday)))
  if ((aramaCevabi || kesinDosyaCevap) && (!komut || hangiHasta)) {
    const speech = aramaCevabi || kesinDosyaCevap || ""
    turNiyeti = aramaCevabi && cozum && cozum.tur !== "tek" ? "hasta-sayim" : niyetBul(message) ?? "hasta-dosya"
    // "Which of these patients?" asked for a command: the command waits for the name.
    await oturumuYaz(speech, { hasta: cozulenHasta, bekleyenKomut: komut && hangiHasta ? { arac: komut.arac, randevu: komut.randevu, hastasiz: true, tarih: null, saat: null, deneme: (komutDevami?.deneme ?? -1) + 1, zaman: simdi() } : null })
    const konusma = konusmaYap(speech)
    soyle(konusma)
    return sade(aramaCevabi ? aramaRota : "hizli-kart", speech, konusma, cozulenHasta?.ad || null)
  }

  // NOTYA-TEK-BEYIN (hız): model turundan önceki okumalar birbirinden bağımsız — sırayla değil, birlikte.
  // NOTYA-EYLEM: hasta kimliği SUNUCUDA çözülür. Bu yüzeyde hasta serbest metinden bulunur
  // (hastaninSozunuCoz) — çözülen hasta belirsizse (cozum.tur === 'coklu') aktifEylemHastasi null
  // kalır, araç sunulmaz ve Ayşe hangi hastayı kastettiğini sorar (docs §2: "ambiguous → ask, no card").
  // NOTYA-AYSE-GERI-03: when the sentence is about a named person who was not found, the open chart is not used.
  const eylemHastaId = cozulenHasta?.id || (!baskaKisiAnildi && contextPatientId ? String(contextPatientId) : null)
  const [kota, hafizaHam, gunHam, currentPatient, eylemHastasi] = await Promise.all([
    // NOTYA-KOTA-01: yazılı sohbet günlük kotaya tabi (dosya gerçeği LLM'e gitmez — kota harcanmaz)
    aiKotaKullan(supabase, doktorId, 'sohbet'),
    // NOTYA-OGRENME-03: meslektaş hafızası — tek kaynak, tüm yüzeyler aynı bloğu okur
    hafizaYukle(supabase, doktorId).then(hafizaBloguSohbet).catch(() => "" /* hafıza kritik değil */),
    // NOTYA-GUN-01: oturumun ilk turlarında günün durumu da promptta (açılış baloncuğuyla tutarlı olsun)
    messages.length < 2
      ? import("@/lib/doktor/gunOzeti").then(async ({ gunVerisiDerle, gunFazi, gunBlogu }) => {
          const gv = await gunVerisiDerle(supabase, doktorId)
          return `\n\n${gunBlogu(gv, gunFazi(gv.saatTRT))}`
        }).catch(() => "" /* gün kritik değil */)
      : Promise.resolve(""),
    // Load current patient if any
    // HASTA-IZOLASYON-01: patientId comes from the request body — only this doctor's patient enters the prompt.
    eylemHastaId
      ? supabase.from("patients").select("*").eq("id", eylemHastaId).eq("doctor_id", doktorId).maybeSingle().then((r) => r.data)
      : Promise.resolve(null),
    eylemKapali() ? Promise.resolve(null) : hastaOzetiGetir(supabase, doktorId, eylemHastaId),
  ])
  if (!kota.izin) return { ok: false, durum: 429, govde: { success: false, error: KOTA_MESAJI }, soz: KOTA_MESAJI }
  const hafizaBlogu = hafizaHam

  // Build system prompt with learning context
  // DAH-/KD-/DERM-PROMPTS-LOCK: branş hekimi (users.specialty) → specialties/<branş>/prompts kilidi (system.md + tools.ts)
  const bransKilidi = dahiliyeMi(hekimBransi, specialty) ? dahiliyeKilidi("asistan") : kadinDogumMi(hekimBransi, specialty) ? kadinDogumKilidi("asistan") : dermatolojiMi(hekimBransi, specialty) ? dermatolojiKilidi("asistan") : gozMi(hekimBransi, specialty) ? gozKilidi("asistan") : ""
  // NOTYA-ONBELLEK-SICAK-YOL: global ve hekim önbellekte (sabit). Hafıza, hasta satırı, branş kilidi
  // ve dosya gövdesi kuyrukla birlikte önbelleksiz — seans sayacı ve hasta satırı her tur değişir,
  // önbelleğe yazmak cevabı yazma bitene kadar bekletir.
  // Gün özeti, kesin cümle ve kanıt kuyrukta; soru dosya önekini bozmaz. Hasta global/hekim'de yok.
  // Branş kilidi hafıza ve hastanın ÜSTÜNE çıkmaz (öncelik cümlesi onları kapsar); dosya gövdesi en sonda.
  const sistem = buildSystemPromptParcalari(persona, prefs, currentPatient, doctorProfile, hafizaBlogu)
  const kararli = sistem.degisken + bransKilidi + dosyaGovde

  // NOTYA-MALIYET-01 (Kaan, 2026-09-19): şüphede uzman tur. Hasta bağlamı, eylem niyeti, klinik sinyal ya da belirsiz mesaj →
  // sohbet-uzman (1600 token — F3); sohbet yalnız net sosyal tur / uygulama kullanımı sorusu. Kural: lib/ai/modeller.ts.
  // NOTYA-MODEL-LUNAPRO-01: iki görev de birincil Luna-Pro; Sonnet 5 yalnız G1–G4 koruyucusu.
  const yonlendirme = asistanModelYonlendir({ mesaj: String(message || ""), hastaBaglami: Boolean(dosyaEk) || Boolean(currentPatient), niyet: quickIntent })

  const eylemBransi = bransAnahtari(hekimBransi)
  // NOTYA-AYSE-GERI-03 — tools.
  //  · Patient resolved: every eligible tool; on a command the call is FORCED — the one tool the wording names (sent
  //    alone), or any tool when no single one is named. The model cannot answer a command with a sentence.
  //  · No patient resolved and the turn is a command: the tools are still offered, each with a `hasta_adi` field.
  //    The call is not forced — with no name said, "Hangi hasta için Hocam?" is the right answer. A name the model
  //    passes is resolved below with the doctor-scoped resolver; it is never an id.
  //  · Otherwise (no patient, not a command): no tools, as before.
  //
  // An appointment's day and time are read by the SERVER from the doctor's words (this sentence, plus what the
  // pending command already holds). "Beste Aydın" is not "beşte": names are taken out before the clock is read. A
  // bare number counts as a time only as the answer to a pending command that still lacks one.
  const zamanSozu = komut?.randevu ? adsiz(onarim.mesaj, [cozulenHasta?.ad, baglam.patientName ? String(baglam.patientName) : null, soylenenAd(onarim.mesaj)]) : ""
  const buTurTarih = komut?.randevu ? randevuTarihiBul(onarim.mesaj, saatDilimi) : null
  const buTurSaat = komut?.randevu ? randevuSaatiBul(zamanSozu, Boolean(komutDevami && !komutDevami.saat)) : null
  const randevuTarih = buTurTarih ?? komutDevami?.tarih ?? null
  const randevuSaat = buTurSaat ?? komutDevami?.saat ?? null
  // A continued command is forced once it is complete: a booking when the day and the time are both known, a move
  // when this sentence gave a new day or time, anything asked without a patient when this sentence named one.
  let komutZorla = Boolean(komut?.zorla)
  if (komut && komutDevami) {
    komutZorla = komut.randevu === "olustur" ? randevuTamMi("olustur", randevuTarih, randevuSaat)
      : komut.randevu === "tasi" ? Boolean(buTurTarih || buTurSaat)
      : komutDevami.hastasiz && adlaCozuldu
  }
  // NOTYA-AYSE-GERI-08: audit switch — the tool list is offered whole and nothing is forced, so the audit can
  // measure whether the primary model calls a tool on its own. Never set in production.
  if (aracZorlamaKapali()) komutZorla = false
  const zorlanan = komutZorla && eylemHastasi ? komut?.arac ?? null : null
  const hastasizArac = !eylemHastasi && Boolean(komut) && !eylemKapali()
  const yazmaAraclari = eylemHastasi
    ? aracTanimlari({ brans: eylemBransi, hasta: eylemHastasi }, { yalniz: zorlanan })
    : hastasizArac ? aracTanimlari({ brans: eylemBransi, hasta: null, hastasiz: true }) : []
  // NOTYA-AYSE-ARAC-PARITE (2026-10-02): the READ tools the voice model had until 2026-09-25 (hasta_bul,
  // randevu_takvim — lib/asistan/okumaAraclari.ts). The routers above are the fast path; when they did not answer,
  // the model can look the answer up itself instead of saying "bilemedim" — with a chart open or not. A command turn
  // keeps its write tools exactly as they were (list, forcing, card path) and is not offered the read tools; a turn
  // that is only a greeting or thanks has nothing to look up.
  const okumaSunulur = !komut && !okumaAraciKapali() && !netSosyalMi(String(message || ""))
  const araclar = okumaSunulur ? [...yazmaAraclari, ...OKUMA_ARACLARI] : yazmaAraclari
  const toolChoice = !araclar.length || !eylemHastasi || !komutZorla
    ? undefined
    : zorlanan && araclar.some((a) => a.name === zorlanan) ? { type: 'tool' as const, name: zorlanan } : ('any' as const)
  // NOTYA-LUNA-ARAMA-01 (2026-09-29): with no chart attached the prompt still says "dosyaya erişimin VAR" and
  // forbids "erişemem" — a compliant model then invents a file ("dosyası açık", made-up aşı/ilaç). Say it plainly.
  // Only when NO patient could be resolved at all (no name, no open patient) — an open patient without a chart this
  // turn (cohort / calendar question) is still a known patient.
  const dosyaYokBlogu = !dosyaEk && !currentPatient ? DOSYA_YOK_BLOGU : ""
  // NOTYA-AYSE-100-LUNA (c): the model clock — doctor-timezone date/time, per turn, never cached.
  // NOTYA-KONUSMA-BAGLAMI-01: the previous turn's topic for the residual model-path questions (≈ 200 tokens, per turn).
  const komutBlogu = !komut ? "" : hastasizArac ? HASTASIZ_KOMUT_BLOGU : komut.randevu && !komutZorla ? randevuSoruBlogu(komut.randevu, randevuTarih, randevuSaat, gunBolumuBul(zamanSozu)) : ""
  const kuyruk = zamanBlogu(saatDilimi) + baglamBlogu(konusmaOnceki) + gunHam + dosyaTur + dosyaYokBlogu + (yazmaAraclari.length ? EYLEM_ISTEM_BLOGU : "") + (okumaSunulur ? OKUMA_ARACI_BLOGU : "") + komutBlogu

  // KD-DERM-SAFETY-FINDINGS F1 + CROSS-SPECIALTY-PARITY: a dose the doctor did not type (and that is not in the patient
  // file / verified drug context) never reaches the chat bubble — for EVERY branch, not only the prompt-locked chapters.
  const dozKaynakMetinleri = [augmentedMessage, dosyaEk, odakDosyaMetni, ...messages.filter((m) => m.role === "user").map((m) => m.content)]
  // `let`: a read-tool result is a source too (set below, before the answer that uses it is generated).
  let dozKaynak = kaynakSayilari(...dozKaynakMetinleri)
  const kdMi = kadinDogumMi(hekimBransi, specialty)
  const liste = kdMi ? kdDogrulanmisKaynaklar() : []
  // NOTYA-AYSE-ALAN-01: the identity placeholders issued in this turn (hasta_alan). References only — the values are
  // read when the final answer is delivered, never before, and never reach a model or the speech provider.
  const alanDefteri = new AlanDefteri()
  const alanSoz = alanSozcusu(alanDefteri)
  // Ses: model yazarken her cümle ekrandakiyle aynı kilitlerden geçer — doğrulanmamış doz / kılavuz numarası söylenmez.
  const sesTemizle = (c: string) => {
    // NOTYA-AYSE-GERI-06: the "ask again with the full chart" marker is never spoken.
    if (sesTamDosyaIstendiMi(c)) return ""
    let t = uydurmaDozTemizle(doktorMetniTemizle(c), dozKaynak).metin
    if (kdMi) t = uydurmaKaynakTemizle(t, liste).metin
    // A sentence that would carry an identity value is not read: once per turn "… ekranınıza yazdım Hocam".
    return alanSoz(t)
  }
  // NOTYA-SES-DEVAM-01: with a continuation behind it the cap is silent — the remainder comes in the next turn.
  const sesAkisiKur = () => (ses && g.sozParcasi ? new SesAkisi(g.sozParcasi, sesTemizle, g.sesSiniri, sesSiniriSec(kanitYoluAktif), Boolean(g.sesDurumu)) : null)
  let sesAkisi = sesAkisiKur()

  const cagriTaban = {
    gorev: yonlendirme.gorev,
    doctorId: doktorId,
    // Hasta dosyası ve aktif hasta system'de — güvenlik sinyali taraması mesajla birlikte bunları da okur.
    guvenlikBaglami: [dosyaGuvenlikMetni, currentPatient ? JSON.stringify(currentPatient) : ""].filter(Boolean).join("\n"),
    araclar,
    toolChoice,
    system: asistanOnbellekBloklari({ global: sistem.global, hekim: sistem.hekim, kararli, kuyruk }),
    messages: [
      // modele son 8 mesaj (4 tur) gider; saklanan geçmiş ve doz-kaynak kontrolü tam listeyi kullanır
      ...gecmisiKirp(messages).map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content
      })),
      { role: "user" as const, content: augmentedMessage }
    ] as AiMesaj[]
  }
  // NOTYA-KADEME-01: sosyal tur ve tek-slot kısa takip turu luna-none (effort none); araç / eylem / ağır soru luna.
  const kademe = sohbetKademesi({
    gorev: yonlendirme.gorev, mesaj: String(message || ""), sonNiyet: takip?.niyet ?? konusmaOnceki?.sonNiyet ?? null,
    niyet: quickIntent, aracSayisi: araclar.length, girdiToken: girdiTokenTahmini(cagriTaban),
  })
  const cagri = kademe.caba ? { ...cagriTaban, caba: kademe.caba } : cagriTaban
  let akanHam = ""
  const modeliCagir = async (c: typeof cagri) => {
    const akis = sesAkisi
    return akis ? aiAkis(c, (p) => { akanHam += p; akis.ekle(speechOneki(akanHam)) }) : aiCagir(c)
  }
  let response = await modeliCagir(cagri)

  // NOTYA-AYSE-100 M1: the text block is not always first (tool_use first, thinking first) — join every text block.
  let rawResponse = yanitMetni(response)

  // NOTYA-AYSE-ARAC-PARITE — server-side read-tool round trip: model call → the read tools it asked for, executed
  // here for the AUTHENTICATED doctor → the results back to the model → the answer. At most OKUMA_TUR_TAVANI round
  // trips; every execution is bounded by its own timeout (okumaAraciCalistir) and never throws. An answer that also
  // carries a write call is not a look-up: it goes to the card path below exactly as before, with no round trip.
  let cagriSon = cagri
  const okuma = { tur: 0, ms: 0, metinler: [] as string[] }
  /** The tool results as sentences for the doctor — the answer when the model adds nothing after its look-up. */
  let okumaYedek = ""
  let okumaKimlik: { cevap: KimlikCevabi; soru: string } | null = null
  let okumaHastasi: { id: string; ad: string } | null = null
  // HASTA-IZOLASYON-01: the tools get the doctor from the session, text from the model, and the open patient from the
  // session (re-checked in the executor). A named person who was not found is never replaced by the open chart.
  const okumaBaglami = {
    supabase, doktorId, saatDilimi, hitapAdi: personaIlkAdi(persona.name), alanDefteri,
    aktifHasta: cozulenHasta ?? (!baskaKisiAnildi && contextPatientId
      ? { id: String(contextPatientId), ad: baglam.currentPatientId && String(baglam.currentPatientId) === String(contextPatientId) && baglam.patientName ? String(baglam.patientName) : "" }
      : null),
  }
  while (okumaSunulur && okuma.tur < OKUMA_TUR_TAVANI) {
    const bloklar = toolUseBloklari(response as unknown as { content?: unknown })
    const cagrilar = bloklar.filter((b) => okumaAraciMi(b.name))
    if (!cagrilar.length || cagrilar.length !== bloklar.length) break
    const aracBas = Date.now()
    okuma.tur++
    const sonuclar: OkumaSonucu[] = await Promise.all(cagrilar.map((b) => okumaAraciCalistir(String(b.name), b.input, okumaBaglami)))
    const aracMs = Date.now() - aracBas
    const gunluk = { kanal: g.kanal, tur: okuma.tur, araclar: cagrilar.map((b) => String(b.name)), hata: sonuclar.filter((s) => s.hata).length, aracMs }
    // VELI-YASAL-ONAM: an identity answer ends the turn here — the values go to the screen, nothing goes back to the model.
    const k = sonuclar.findIndex((s) => s.kimlik)
    if (k >= 0) {
      okumaKimlik = { cevap: sonuclar[k].kimlik as KimlikCevabi, soru: String(((cagrilar[k].input || {}) as Record<string, unknown>).isim ?? "").slice(0, 600) }
      okuma.ms += aracMs
      console.info("[asistan/chat] okuma araci", { ...gunluk, modelMs: 0, ekMs: aracMs, kimlik: true })
      break
    }
    okuma.metinler.push(...sonuclar.map((s) => s.sonuc))
    dozKaynak = kaynakSayilari(...dozKaynakMetinleri, ...okuma.metinler)
    okumaYedek = sonuclar.map((s) => s.hekimMetni || "").filter(Boolean).join("\n\n")
    okumaHastasi = sonuclar.find((s) => s.hasta)?.hasta ?? okumaHastasi
    const asistanIcerik = ((response as unknown as { content?: unknown[] }).content || []).filter((b) => {
      const x = b as { type?: string; text?: string }
      return x?.type === "tool_use" || (x?.type === "text" && Boolean(String(x.text || "").trim()))
    })
    const sonucIcerik = cagrilar.map((b, i) => ({ type: "tool_result", tool_use_id: String(b.id || ""), content: sonuclar[i].sonuc, ...(sonuclar[i].hata ? { is_error: true } : {}) }))
    cagriSon = { ...cagriSon, messages: [...cagriSon.messages, { role: "assistant", content: asistanIcerik }, { role: "user", content: sonucIcerik }] }
    akanHam = ""
    sesAkisi = sesAkisiKur()
    const modelBas = Date.now()
    try {
      response = await modeliCagir(cagriSon)
    } catch (e) {
      // The look-up worked and the model did not come back: the doctor still gets what was found.
      if (!okumaYedek) throw e
      console.error("[asistan/chat] okuma araci sonrası model", e instanceof Error ? e.name : "hata")
      response = { content: [{ type: "text", text: JSON.stringify({ speech: okumaYedek }) }], stop_reason: "end_turn" } as unknown as typeof response
    }
    rawResponse = yanitMetni(response)
    const modelMs = Date.now() - modelBas
    okuma.ms += aracMs + modelMs
    console.info("[asistan/chat] okuma araci", { ...gunluk, modelMs, ekMs: aracMs + modelMs })
  }
  if (okumaKimlik) {
    const kc = okumaKimlik.cevap
    turNiyeti = "hasta-dosya"
    await oturumuYaz(kc.model, { hasta: kc.hasta, kimlik: true, kimlikSorusu: okumaKimlik.soru })
    const konusma = kimlikSozu(kc)
    soyle(konusma)
    return sade("kimlik", kc.ekran, konusma, kc.hasta?.ad || null)
  }
  if (okuma.tur) {
    // The round-trip cap is reached and the model asks to look up again: it answers with what it has.
    const kalan = toolUseBloklari(response as unknown as { content?: unknown })
    if (kalan.length && kalan.every((b) => okumaAraciMi(b.name))) {
      response = { ...response, content: ((response as unknown as { content?: { type?: string }[] }).content || []).filter((b) => b?.type !== "tool_use") } as unknown as typeof response
    }
    if (okumaHastasi && !cozulenHasta) cozulenHasta = okumaHastasi
    void import("@/lib/doktor/ogrenme/hizOlc").then((m) => m.hizYazSessiz({ doctorId: doktorId, gorev: "sohbet-okuma-araci", sureMs: okuma.ms })).catch(() => { /* ölçüm */ })
  }

  // NOTYA-AYSE-GERI-06 (audit §4.6, PR 7): the voice turn was sent the SHORT chart and the answer is not in it. The
  // model no longer tells the doctor so ("Bu ayrıntı sesli özetimde yok Hocam…") — it writes a marker, nothing has
  // been spoken, and the same turn is asked once more with the full chart. One retry; a second marker is answered
  // plainly below.
  if (sesTamGovde && sesTamDosyaIstendiMi(rawResponse) && !toolUseBloklari(response as unknown as { content?: unknown }).length) {
    console.info("[asistan/chat] ses tam dosya yeniden", { kanal: g.kanal })
    akanHam = ""
    sesAkisi = sesAkisiKur()
    response = await modeliCagir({ ...cagriSon, system: asistanOnbellekBloklari({ global: sistem.global, hekim: sistem.hekim, kararli: sistem.degisken + bransKilidi + sesTamGovde, kuyruk }) })
    rawResponse = yanitMetni(response)
    if (sesTamDosyaIstendiMi(rawResponse)) rawResponse = JSON.stringify({ speech: `${odakHastaAdi || "Hastanın"} dosyasında bu bilgi yok Hocam.` })
  }

  // KD-DERM-SAFETY-FINDINGS F3: never raw JSON to the doctor — a max_tokens cut is salvaged (speech up to the cut +
  // "yanıt kesildi" note) and a half-written action is dropped.
  const aiData = asistanYanitiCoz(rawResponse, response.stop_reason)
  if (aiData.kesildi) console.warn("[asistan/chat] yanıt kesildi", { stop_reason: response.stop_reason, uzunluk: rawResponse.length })
  // NOTYA-AYSE-ARAC-PARITE: the model looked something up and wrote nothing after it — what the tool found is the answer.
  if (!String(aiData.speech || "").trim() && okumaYedek) aiData.speech = okumaYedek
  // KD-DERM-SAFETY-FINDINGS F4: no internal field names / invented consent form numbers in the bubble
  aiData.speech = doktorMetniTemizle(aiData.speech)
  // NOTYA-AYSE-GERI-06: the full-chart marker is an instruction to the server, never text for the doctor.
  if (String(aiData.speech || "").includes(SES_TAM_DOSYA_ISARETI)) aiData.speech = String(aiData.speech).split(SES_TAM_DOSYA_ISARETI).join(" ").replace(/\s+/g, " ").trim()
  if (aiData.proactiveWarning) aiData.proactiveWarning = doktorMetniTemizle(aiData.proactiveWarning)

  const dozTemiz = uydurmaDozTemizle(String(aiData.speech || ""), dozKaynak)
  if (dozTemiz.dozlar.length) console.warn("[asistan/chat] doz kilidi", { brans: hekimBransi || specialty, dozlar: dozTemiz.dozlar })
  aiData.speech = dozTemiz.metin
  if (aiData.proactiveWarning) aiData.proactiveWarning = uydurmaDozTemizle(String(aiData.proactiveWarning), dozKaynak).metin
  // The prompt-locked chapters also promise "sohbette doz sorulursa sayı verme" — there the hekim is told why a number went.
  if (dozKilitliBrans(hekimBransi, specialty)) {
    if (dozTemiz.dozlar.length) aiData.speech = `${aiData.speech}\n\n⚠ Doz kontrolü (hekim onayı): mesajda/dosyada geçmeyen doz ifadesi yanıttan çıkarıldı; doz hekim tarafından belirlenir.`
  }
  // KD-KAYNAK-KILIDI: a kadın doğum answer never carries a guideline number / year from memory (ACOG PB 797, TJOD 2019 …).
  if (kdMi) {
    const r = uydurmaKaynakTemizle(String(aiData.speech || ""), liste)
    if (r.bulgular.length) console.warn("[asistan/chat] kaynak kilidi", r.bulgular)
    aiData.speech = r.bulgular.length ? `${r.metin}\n\n⚠ Kaynak kontrolü (hekim onayı): doğrulanamayan kılavuz numarası / yılı yanıttan çıkarıldı; kaynağı hekim doğrular.` : r.metin
    if (aiData.proactiveWarning) aiData.proactiveWarning = uydurmaKaynakTemizle(String(aiData.proactiveWarning), liste).metin
  }
  // NOTYA-SES-AKTIF-HASTA-01: no chart this turn → the model may not claim one is open.
  if (!cozulenHasta && !currentPatient && /dosya\w*\s+(açık|açtım|açıyorum|açıldı|önümde|hazır)/iu.test(String(aiData.speech || ""))) {
    aiData.speech = "Şu an açık bir hasta dosyası yok Hocam; hastanın adını söylerseniz dosyasını açarım."
  }
  // NOTYA-HASTA-ODAK-01: açık dosyadayken uydurma liste / recant / başka hasta dilliği geri çekilir.
  // NOTYA-AYSE-ARAC-PARITE: a practice-wide look-up (no chart bound this turn, the tool named no patient) is not about
  // the open patient — the lock must not put that patient's name in front of a practice answer.
  const pratikOkumasi = okuma.tur > 0 && !odakHastaAdi && !okumaHastasi
  const odakAd = pratikOkumasi ? '' : odakHastaAdi || (cozulenHasta?.ad ?? (baglam.patientName ? String(baglam.patientName) : ''))
  // A read-tool result is chart text of this turn as much as the chart block is.
  const odak = hastaOdakTemizle(String(aiData.speech || ''), odakAd ? { ad: odakAd, dosyaMetni: [odakDosyaMetni || dosyaEk, ...okuma.metinler].join("\n"), kanitYolu: kanitYoluAktif || okuma.tur > 0 } : null)
  if (odak.ihlal.length) console.warn("[asistan/chat] hasta odak kilidi", { ihlal: odak.ihlal, ad: odakAd })
  aiData.speech = odak.metin
  if (takvimRecantMi(aiData.speech)) {
    const sonTakvim = [...messages].reverse().find((m) => m.role === "assistant" && sonTakvimCevabiMi(m.content))
    if (sonTakvim) aiData.speech = String(sonTakvim.content)
  }

  // Ses: modelin cevabı söylendi (ya da akış yoksa şimdi kurulur); aşağıdaki ekler (yönlendirme, kart okuması) sona eklenir.
  const sozler: string[] = []
  if (ses) sozler.push(sesAkisi ? sesAkisi.bitir() : konusmaYap(aiData.speech, sesTemizle))
  // The stream said nothing (the full-chart marker was all the model wrote, twice) but there is an answer on screen:
  // it is spoken now — a voice turn never ends in silence while the screen shows a sentence.
  if (ses && sesAkisi && !sozler[0] && String(aiData.speech || "").trim() && !toolUseBloklari(response as unknown as { content?: unknown }).length) {
    sozler.length = 0
    const soz = konusmaYap(aiData.speech, sesTemizle)
    sozler.push(soz)
    soyle(soz)
  }
  const sozEkle = (s: string) => { if (!ses || !s) return; sozler.push(s); soyle(s) }

  // NOTYA-KONUSMA-BAGLAMI-06 (Kaan live, 2026-09-30): a calendar question is answered by the calendar reader, never by
  // "takvimden kontrol etmek gerekir". When the (rewritten) intent is calendar and a day resolves, the model's
  // deflection is replaced with the deterministic day summary — this is the last line of defence behind the matcher.
  if ((takip?.niyet === "takvim" || niyetBul(message) === "takvim") && takvimSapmasiMi(aiData.speech)) {
    const gun = takvimSorusuCoz(message, { saatDilimi })?.tarih || varliklariCikar(message, { tz: saatDilimi }).tarih || takip?.varliklar.tarih || null
    if (gun) {
      try {
        const satirlar = await doktorunGununuOku(supabase, doktorId, gun, saatDilimi)
        const ozet = gunlukOzetMetni({ tarih: gun, satirlar, istenenSaat: null, istenenSureDk: 20 })
        console.warn("[asistan/chat] takvim sapması → deterministik", { gun, model: String(aiData.speech || "").slice(0, 120) })
        aiData.speech = ozet.metin
        turNiyeti = "takvim"
        if (ses) { sozler.length = 0; sozEkle(gunlukKonusmaMetni({ tarih: gun, satirlar, istenenSaat: null, cakisiyor: ozet.cakisiyor, cakisan: ozet.cakisan, tz: saatDilimi })) }
      } catch (e) {
        console.error("[asistan/chat] takvim sapması okunamadı", e instanceof Error ? e.message : String(e))
      }
    }
  }

  // NOTYA-EYLEM: tool_use → taslak öneri + onay kartı. Hiçbir şey yazılmadı; hekim onaylayacak.
  const yuzey = ses ? "ses" as const : "sohbet" as const
  // NOTYA-AYSE-GERI-04: the action clock is the doctor's timezone, and the day / time the doctor SAID (resolved by
  // the server from this sentence and the pending command) replaces whatever the model wrote in those fields.
  const eylemCtx = (h: HastaOzeti) => ({ supabase, doktorId, hasta: h, brans: eylemBransi, oneriId: "", ...eylemZamani(saatDilimi) })
  const sunucuDegerleri = (anahtar: string) => sunucuTarihDegerleri({ anahtar, mesaj: onarim.mesaj, saatDilimi, randevuTarih, randevuSaat })
  /** Questions the action layer asks instead of a card ("Hangisi Hocam: 1. …, 2. …?"). */
  const kartSorulari: string[] = []
  /** The patient the cards belong to — the resolved / open patient, or the one a patient-less tool call named. */
  let kartHastasi: HastaOzeti | null = eylemHastasi
  let eylemOnerileri: HazirOneri[] = []
  const yanitGovdesi = response as unknown as { content?: unknown }
  if (eylemHastasi) {
    // NOTYA-EYLEM-21: Ayşe'nin kendi uyarı cümlesi karta "Ayşe'nin notu" olarak taşınır — deterministik
    // kontrolün yerine değil, yanına; asla `ciddi` sayılmaz (core/eylemler/ilacUyari.ts).
    eylemOnerileri = await toolUseOnerileri(yanitGovdesi, eylemCtx(eylemHastasi), yuzey, { brans: eylemBransi, hasta: eylemHastasi }, aiData.proactiveWarning, { sorular: kartSorulari, sunucuDegerleri })
  } else if (hastasizArac) {
    // NOTYA-AYSE-GERI-03: a tool call with no patient resolved. The model passed a NAME (`hasta_adi`), never an id.
    // It is resolved here with the doctor-scoped resolver: one match → the card is prepared for that patient;
    // several → which one; none → the same sentence whether the name is nobody's or another doctor's patient
    // (HASTA-IZOLASYON-01: a foreign patient is indistinguishable from a missing one).
    const cagrilar = toolUseBloklari(yanitGovdesi)
    if (cagrilar.length) {
      const adlar = [...new Set(cagrilar.map((b) => String((b.input as Record<string, unknown> | null)?.[HASTA_ADI_ALANI] ?? "").trim()).filter(Boolean))]
      if (!adlar.length) {
        kartSorulari.push("Hangi hasta için Hocam?")
      } else if (adlar.length > 1) {
        kartSorulari.push("Bir seferde tek hasta için hazırlayabilirim Hocam; hangi hastadan başlayalım?")
      } else {
        const adCozumu = await hastaninSozunuCoz(supabase, doktorId, adlar[0], { yalnizAd: true, adKesin: true, tz: saatDilimi })
        const ozet = adCozumu.tur === "tek" ? await hastaOzetiGetir(supabase, doktorId, adCozumu.patientId) : null
        if (ozet) {
          kartHastasi = ozet
          cozulenHasta = { id: ozet.id, ad: ozet.ad }
          eylemOnerileri = await toolUseOnerileri(yanitGovdesi, eylemCtx(ozet), yuzey, { brans: eylemBransi, hasta: ozet }, aiData.proactiveWarning, { sorular: kartSorulari, sunucuDegerleri })
        } else if (adCozumu.tur === "coklu") {
          kartSorulari.push(cozumKonus(adCozumu) || "Bu isimle birden çok hasta var Hocam; hangisi?")
        } else {
          kartSorulari.push(`“${adlar[0].slice(0, 80)}” adında bir hasta kayıtlarınızda bulamadım Hocam; adını ve soyadını tam söyler misiniz?`)
        }
      }
    }
  }
  // No card could be prepared: the question IS the answer. The model's own text (if any) may claim a card exists.
  if (!eylemOnerileri.length && kartSorulari.length) {
    const soru = kartSorulari.join(" ")
    aiData.speech = soru
    sozEkle(konusmaYap(soru))
  }

  // NOTYA-EYLEM-24: the OLD silent write path is closed. A legacy `{ action: { type, data } }`
  // from the model is classified (lib/asistan/actionExecutor.ts) and NEVER executed against a
  // clinical table. Where an eylem equivalent exists the payload becomes a taslak + onay kartı —
  // the same spine, the same tap, the same audit row. Everything else (reçete, tanı, hasta/seans
  // açma) becomes a Turkish sentence plus a deep link to the screen where it belongs.
  let actionResult: ActionResult | null = null
  let eylemYonlendirme: { metin: string; etiket: string | null; yol: string | null } | null = null
  if (aiData.action) {
    const tip = String((aiData.action as { type?: unknown }).type || "")
    const veriler = ((aiData.action as { data?: unknown }).data || {}) as Record<string, unknown>
    const karar = eskiEylemKarari(tip, eylemHastasi?.id ?? null)
    // Kept for the response shape (and as the tripwire test's subject): it writes nothing.
    actionResult = await executeAction({ type: tip as never, doctorId: doktorId, data: veriler, doctorProfile })

    let kartCikti = false
    if (karar.sinif === "klinik_eylem" && karar.eylemAnahtar && eylemHastasi) {
      // Provenance is literally true: the line is what the doctor asked for in THIS turn, and the
      // card shows it in an editable box with the doctor's own sentence quoted underneath.
      const metin = String(veriler.content ?? veriler.metin ?? "").trim()
      if (metin) {
        const o = await oneriHazirla({
          ctx: eylemCtx(eylemHastasi),
          anahtar: karar.eylemAnahtar,
          girdi: { metin, alan_kaynaklari: { metin: { kaynak: "doktor_soyledi", alinti: String(message || "").slice(0, 400) } } },
          yuzey,
          suzgec: { brans: eylemBransi, hasta: eylemHastasi },
        })
        if (o) { eylemOnerileri.push(o); kartCikti = true }
      }
    }
    if (!kartCikti) {
      const soz = karar.sinif === "klinik_eylem"
        ? "Bunu dosyaya ben yazmıyorum — hangi hastanın dosyası olduğunu söylerseniz kartını hazırlayayım, kaydı siz onaylarsınız."
        : karar.metin
      aiData.speech = `${String(aiData.speech || "").trimEnd()}\n\n${soz}`.trim()
      if (karar.sinif !== "klinik_disi") eylemYonlendirme = { metin: soz, etiket: karar.etiket ?? null, yol: karar.yol ?? null }
      sozEkle(konusmaYap(soz))
    } else {
      aiData.speech = `${String(aiData.speech || "").trimEnd()}\n\n${karar.metin}`.trim()
    }
  }

  // NOTYA-TEK-BEYIN: yeni kartlar bu oturumda "bekleyen" olur — sesli "Evet" (lib/asistan/sesliOnay.ts, model turu
  // dışında) en son hazırlanan kartı onaylar.
  let bekleyen: string[] | undefined
  if (eylemOnerileri.length) {
    bekleyen = eylemOnerileri.map((o) => o.id)
    if (ses && kartHastasi) sozEkle(kartOkumasi(eylemOnerileri, kartHastasi.ad, bugunTz(saatDilimi)))
  }
  // NOTYA-AYSE-100 M1: a tool-only turn left the screen blank; a model turn with no text and no card says so.
  if (!String(aiData.speech || "").trim()) {
    aiData.speech = eylemOnerileri.length && kartHastasi
      ? kartOkumasi(eylemOnerileri, kartHastasi.ad, bugunTz(saatDilimi))
      : "Bu soruya şu an cevap üretemedim Hocam; bir daha sorar mısınız?"
    if (ses && !sozler.some(Boolean)) sozEkle(konusmaYap(aiData.speech))
  } else if (eylemOnerileri.length) {
    // NOTYA-AYSE-GUVENLIK-01: the model wrote its own sentence next to the card. Whatever it says, the written
    // answer still states the card's serious warning and how it is acknowledged — a conflict is never left to
    // the model's wording (the voice channel has already said it in kartOkumasi above).
    const uyari = kartUyariSozu(eylemOnerileri)
    if (uyari) aiData.speech = `${String(aiData.speech).trimEnd()}\n\n${uyari}`
  }

  // NOTYA-SES-DEVAM-01 (Dr. Gökhan: "özet yarıda kesilmesin"): the voice turn closed before everything was said
  // (5-sentence cap or the 22 s guard) → the unspoken rest, uncapped, waits for the page's hidden [devam] turn.
  let sesDevamKalan = ""
  const durum = ses ? g.sesDurumu?.() : undefined
  if (durum?.kesildi) {
    // The extras after the model's answer (card read-back, redirect sentence). On the ElevenLabs route the turn is
    // closed at the cut, so they are still unspoken and belong to the remainder. On the Fish route the stream stays
    // open and they were just spoken: the read-back question ("Onaylıyor musunuz?") must stay the LAST thing said,
    // so nothing is queued behind it — the rest of the answer is on screen.
    const soylenenDuz = durum.soylenen.replace(/\s+/g, " ")
    const ekler = sozler.slice(1).filter(Boolean)
    const ekSoylendi = ekler.some((e) => soylenenDuz.includes(e.replace(/\s+/g, " ").trim()))
    sesDevamKalan = ekSoylendi ? "" : sesDevamKalani([...sozCumleleri(String(aiData.speech || ""), sesTemizle), ...ekler], durum.soylenen)
  }

  // NOTYA-AYSE-ALAN-01: two forms of the answer from here on.
  //  · `aiData.speech` — the PLACEHOLDER form. Placeholders issued in this turn stay, any other one is removed. This is
  //    what is stored, learned from and sent to a model on later turns.
  //  · `ekranMetni` — the doctor's form: the server puts the values in, for this doctor's own patient, now. It goes to
  //    the client and nowhere else.
  const alanTemiz = verilmeyenleriSil(String(aiData.speech || ""), alanDefteri)
  aiData.speech = alanTemiz.metin
  if (aiData.proactiveWarning) aiData.proactiveWarning = verilmeyenleriSil(String(aiData.proactiveWarning), null).metin
  const alanRefleri = alanDefteri.kullanilan(alanTemiz.metin)
  const ekranMetni = alanRefleri.length ? await alanlariYerineKoy(supabase, doktorId, alanTemiz.metin, alanRefleri) : alanTemiz.metin
  if (alanRefleri.length || alanTemiz.silinen) {
    // Audit: field and patient references, never the values.
    console.info("[asistan/chat] alan", { kanal: g.kanal, alanlar: alanRefleri.map((r) => ({ alan: r.alan, hasta: r.hastaId })), silinen: alanTemiz.silinen })
    if (alanRefleri.length) void import("@/lib/security/auditLogger").then((m) => m.logKimlikAlani(doktorId, alanRefleri, g.kanal)).catch(() => { /* denetim kaydı turu durdurmaz */ })
  }

  // Update conversation history
  turNiyeti = turNiyeti ?? niyetBul(message) ?? (dosyaEk || currentPatient ? "hasta-dosya" : "genel")
  // NOTYA-AYSE-GERI-03: a command that ended without a card is still open — what was said so far waits for the
  // doctor's next sentence. A card, or a turn that is not a command, closes it.
  const yeniBekleyenKomut: BekleyenKomut | null = komut && !eylemOnerileri.length
    ? { arac: komut.arac, randevu: komut.randevu, hastasiz: !kartHastasi, tarih: komut.randevu ? randevuTarih : null, saat: komut.randevu ? randevuSaat : null, deneme: (komutDevami?.deneme ?? -1) + 1, zaman: simdi() }
    : null
  await oturumuYaz(String(aiData.speech), { hasta: cozulenHasta, kartlar: eylemOnerileri.map((o) => o.id), kartHastaId: kartHastasi?.id ?? null, bekleyen, sesDevamKalan, bekleyenKomut: yeniBekleyenKomut, alanlar: alanRefleri })

  // Log action for learning
  await supabase.from("asistan_actions").insert({
    doctor_id: doktorId,
    asistan_session_id: oturumId,
    action_type: quickIntent || "GENERAL_CHAT",
    input_text: message,
    ai_response: aiData.speech,
    action_data: aiData.action || {}
  })

  // NOTYA-OGRENME-03 / V2: ilişki sayacı istekte kalır (ucuz); LLM öğrenme waitUntil.
  try {
    const iliski = await seansIsle(supabase, doktorId, "sohbet")
    const ogren = ogrenmeyeDeger(String(message || ""))
    const ozet = iliski.seans_sayisi >= 5 && iliski.seans_sayisi - iliski.ozet_seans >= 5
    if (ogren || ozet) {
      const { arkaPlandaSurdur } = await import("@/lib/doktor/ogrenme/arkaPlandaOgren")
      const gecmis = messages.slice(-4).map((m: { role: string; content: string }) => ({ role: m.role, content: m.content }))
      const soz = String(aiData.speech)
      const mesaj = String(message)
      arkaPlandaSurdur((async () => {
        try {
          if (ogren) {
            await sohbettenOgren(supabase, doktorId, [
              ...gecmis,
              { role: "user", content: mesaj },
              { role: "assistant", content: soz },
            ])
          }
          if (ozet) await ozetGerekirseGuncelle(supabase, doktorId)
        } catch (e) { console.error("[hafiza] sohbet arka plan", e) }
      })())
    }
  } catch (e) { console.error("[hafiza] sohbet", e) }

  // Miras sayaç (doctor_preferences) — last_session_at
  if (!prefs) {
    await supabase.from("doctor_preferences").insert({ doctor_id: doktorId, sessions_completed: 1, last_session_at: new Date().toISOString() })
  } else {
    await supabase.from("doctor_preferences").update({ last_session_at: new Date().toISOString() }).eq("doctor_id", doktorId)
  }

  void import("@/lib/doktor/ogrenme/hizOlc").then((m) => m.hizYazSessiz({
    doctorId: doktorId, gorev: "sohbet", sureMs: Date.now() - cevapBas, onbellekli: dosyaOnbellekten,
  })).catch(() => { /* ölçüm */ })

  rotaYaz("model", { arac: toolChoice ?? null, aracSayisi: araclar.length, kart: eylemOnerileri.length, okuma: okuma.tur })
  return {
    ok: true,
    cevap: {
      rota: "model",
      ekran: ekranMetni,
      konusma: sozler.filter(Boolean).join(" ").trim(),
      kartlar: eylemOnerileri,
      kartHastaId: eylemOnerileri.length ? kartHastasi?.id ?? null : null,
      oncekiBekleyen: Array.isArray(baglam.bekleyenOneriler) ? baglam.bekleyenOneriler.map(String) : [],
      aktifHasta: cozulenHasta?.ad || null,
      oturumId,
      veri: {
        eylemOnerileri,
        eylemYonlendirme,
        eylemHastasi: kartHastasi ? { ad: kartHastasi.ad, dogumTarihi: kartHastasi.dogumTarihi } : null,
        speech: ekranMetni,
        proactiveWarning: aiData.proactiveWarning,
        action: aiData.action,
        actionResult,
        asistanSessionId: oturumId,
        aktifHasta: cozulenHasta?.ad || null,
        personaId,
        personaName: persona.name,
        rota: "model",
      },
    },
  }
}

/**
 * Yeni asistan oturumu (yazılı sohbetin ilk mesajı ya da sesli görüşmenin başlangıcı — /api/asistan/signed-url).
 * `patientId` çağıranda sahipliği doğrulanmış olmalıdır.
 */
export async function asistanOturumuAc(
  supabase: SupabaseClient,
  o: { doktorId: string; personaId?: string | null; specialty: string; hekimBransi?: string | null; patientId?: string | null; sessionId?: string | null },
): Promise<Record<string, unknown> | null> {
  // doctor_preferences.preferred_persona is not read: nothing ever writes it, every row holds the schema default
  // 'elifsahin' (nöroloji), so from their 2nd chat every doctor got the neurology colleague (ASISTAN-PERSONA-BRANS).
  // The doctor's real pick arrives as personaId (asistan page tab, localStorage).
  const personaId: PersonaId = (o.personaId as PersonaId) || varsayilanPersonaId(o.specialty, o.hekimBransi)
  const { data } = await supabase
    .from("asistan_sessions")
    .insert({
      doctor_id: o.doktorId,
      patient_id: o.patientId || null,
      session_id: o.sessionId || null,
      persona_id: personaId,
      messages: [],
      active_context: { specialty: o.specialty, currentPatientId: o.patientId }
    })
    .select().single()
  return data
}

/** Kimlik cevabının sözlü biçimi: değer ASLA okunmaz. */
export function kimlikSozu(k: KimlikCevabi): string {
  if (k.hasta) return kimlikEkrandaSozu(k.hasta.ad)
  return konusmaYap(k.ekran)
}

/** Kart(lar) için sözlü okuma — "Kart ekranda. Henüz dosyaya yazılmadı. Onaylıyor musunuz?" (ses-eylem ile aynı cümle). */
function kartOkumasi(kartlar: HazirOneri[], hastaAd: string, bugun?: string): string {
  if (kartlar.length > 1) {
    const uyari = kartUyariSozu(kartlar)
    return `${hastaAd} için ${kartlar.length} kayıt kartı hazırladım, ekranda. Henüz dosyaya yazılmadı.${uyari ? ` ${uyari}` : ''} Ekrandan onaylayın ya da tek tek söyleyin.`
  }
  const o = kartlar[0]
  return sesOzetMetni({ etiket: o.etiket, hastaAd, veri: o.veri, alanlar: o.alanlar, eksik: o.eksik_alanlar.filter((a) => o.zorunlu.includes(a)), ek: (o.uyarilar || []).join(' '), bugun, uyariDetay: o.uyari_detay })
}

/**
 * NOTYA-AYSE-GUVENLIK-01 — the serious warnings of the prepared card(s) and how they are acknowledged, as one
 * paragraph. Null when no card carries one. The words are the deterministic check's, not the model's.
 */
export function kartUyariSozu(kartlar: HazirOneri[]): string | null {
  const uyari = ciddiUyariSozu(kartlar.flatMap((o) => o.uyari_detay || []))
  return uyari ? `${uyari} ${UYARI_ONAY_SOZU}` : null
}

