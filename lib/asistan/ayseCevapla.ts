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
import { kapsamKarari } from "@/lib/asistan/kapsamKilidi"
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
import { cozumKonus, hastaninSozunuCoz, type HastaCozumu } from "@/lib/doktor/hastaCozumleyici"
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
import { aktifHastaKullanilsinMi, dosyaAcmaIstegiMi } from "@/lib/asistan/aktifHasta"
import { aiAkis, aiCagir, girdiTokenTahmini, yanitMetni } from "@/lib/ai/cagir"
import { asistanModelYonlendir, gecmisiKirp, sohbetKademesi, SOHBET_SAKLANAN_MESAJ } from "@/lib/ai/modeller"
import { aracTanimlari, eylemKapali } from "@/core/eylemler/araclar"
import { toolUseOnerileri, oneriHazirla, kayitNiyetiMi, type HazirOneri } from "@/core/eylemler/oneri"
import { hastaOzetiGetir } from "@/core/eylemler/hasta"
import { EYLEM_ISTEM_BLOGU } from "@/core/eylemler/istem"
import { bugunTRT, type HastaOzeti } from "@/core/eylemler/types"
import { sesOzetMetni } from "@/core/eylemler/sesKapilari"
import { bransAnahtari } from "@/lib/specialties/bransAnahtari"
import { konusmaYap, okumaIstegiMi, SesAkisi, sesSiniriSec, SOZ_BEAT_SINIRI, sozCumleleri, sesDevamKalani } from "@/lib/asistan/konusma"
import { soruTuruBul, type SoruTuru } from "@/lib/asistan/dosyaSorgu/soruTuru"
import { kanitBlogu } from "@/lib/asistan/dosyaSorgu/kanit"
import { dosyaSorguKuralBlogu } from "@/lib/asistan/dosyaSorgu/kurallar"
import type { DosyaHastasi, DosyaOlayi } from "@/lib/doktor/dosyaOlaylari"
import { hastaOdakTemizle } from "@/lib/asistan/hastaOdakKilidi"
import { hastaOzetiKisa } from "@/lib/doktor/hastaDosyaKisa"
import { sesOzetKurali, sesTamDosyaGerekirMi } from "@/lib/asistan/sesDosya"
import { takvimSorusuCoz, sesGurultusuMu, takvimTakipCoz, takvimRecantMi, sonTakvimCevabiMi, takvimSapmasiMi } from "@/lib/randevu/takvimSorusu"
import { baglamOku, takipCoz, baglamKur, baglamBlogu, niyetBul, varliklariCikar, asrOnar, type Niyet } from "@/lib/asistan/konusmaBaglami"
import { doktorunGununuOku, gunlukKonusmaMetni, gunlukOzetMetni, haftalikOzetMetni } from "@/lib/randevu/gunlukOzet"
import { isoGunKaydir, saatDilimiSec } from "@/lib/randevu/tarihCozumle"
import { zamanBlogu } from "@/lib/asistan/zamanBlogu"
import { randevuV2Acik } from "@/lib/randevu/v2/ozellik"

export type Kanal = "yazi" | "ses"

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

[BU TURDA AÇIK HASTA DOSYASI YOK] Bu mesajda adı çözülen bir hasta yok ve sana dosya verilmedi. Bir hasta hakkında soru soruluyorsa dosyadan bilgi VERME, "dosyası açık / önümde / baktım" DEME, aşı / ilaç / lab / vizit uydurma. Mesajda bir kişi adı geçiyorsa o ad kayıtlarda BULUNAMAMIŞTIR: "<ad> adında bir hasta kayıtlarınızda bulamadım Hocam; adını ve soyadını tam söyler misiniz?" de — "dosyasını açın / seçin / açıp sorun" DEME (dosyayı sen açarsın, doktor değil). Ad geçmiyorsa hastanın adını ve soyadını iste. Hasta gerektirmeyen klinik ya da uygulama sorusuna normal cevap ver.`

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
  const takip = konusmaOnceki ? takipCoz(hamMesaj, konusmaOnceki, { tz: saatDilimi }) : null
  if (takip) {
    message = takip.soru
    console.info("[asistan/chat] takip", { miras: takip.miras, niyet: takip.niyet })
  }
  /** Intent of this turn as the deterministic paths decide it; the model path falls back to the intent words. */
  let turNiyeti: Niyet | null = null

  /** Tek yazma noktası: geçmiş + (varsa) çözülen hasta + (varsa) bekleyen kart listesi. */
  const oturumuYaz = async (asistanSozu: string, ek: { hasta?: { id: string; ad: string } | null; kartlar?: string[]; kartHastaId?: string | null; kimlik?: boolean; bekleyen?: string[]; sesDevamKalan?: string } = {}) => {
    // NOTYA-SES-TUR-02: this turn was cancelled (barge-in / sentence merge) -- never let its answer reach
    // the session record, where a later poll or follow-up turn could surface it as a fresh answer.
    if (g.sinyal?.aborted) return
    const kullanici: OturumMesaji = ses ? { role: "user", content: hamMesaj, kanal: "ses", zaman: simdi() } : { role: "user", content: hamMesaj }
    const asistanZamani = simdi()
    const asistan: OturumMesaji = ses
      ? {
          role: "assistant", content: asistanSozu, kanal: "ses", zaman: asistanZamani,
          ...(ek.kartlar?.length ? { kartlar: ek.kartlar, hastaId: ek.kartHastaId ?? null } : {}),
          ...(ek.kimlik ? { kimlik: true, hastaId: ek.hasta?.id ?? (contextPatientId ? String(contextPatientId) : null) } : {}),
        }
      : { role: "assistant", content: asistanSozu }
    // NOTYA-SES-DEVAM-01: a new real doctor turn drops the previous turn's unspoken remainder.
    const { sesDevam: eskiDevam, currentPatientId, patientName, ...geriBaglam } = baglam
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

  const sade = (ekran: string, konusma: string, aktifHasta: string | null, veriEk: Record<string, unknown> = {}): AyseSonucu => ({
    ok: true,
    cevap: {
      ekran, konusma, kartlar: [], aktifHasta, oturumId,
      veri: {
        eylemOnerileri: [], eylemYonlendirme: null, eylemHastasi: null, speech: ekran, proactiveWarning: null,
        action: null, actionResult: null, asistanSessionId: oturumId, aktifHasta, personaId, personaName: persona.name, ...veriEk,
      },
    },
  })

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
  const kapsam = kapsamKarari(hamMesaj, { oncekiRed })
  if (kapsam === 'disi' || (kapsam === 'belirsiz' && !takip)) {
    const sabit = kapsam === 'disi' ? KAPSAM_RED : KAPSAM_SORU
    console.info('[asistan/chat] kapsam', { karar: kapsam, kanal: g.kanal, oncekiRed })
    soyle(sabit)
    await oturumuYaz(sabit, {})
    return sade(sabit, sabit, baglam.patientName ? String(baglam.patientName) : null)
  }
  // NOTYA-SES-TAKVIM-01: clinic day/slot is a doctor-scoped lookup — no dossier, no model.
  // Voice was waiting on the open patient's full file, then the socket dropped before TTS.
  const sonTakvimAsistan = [...messages].reverse().find((m) => m.role === "assistant" && sonTakvimCevabiMi(m.content))
  const takvim = kayitNiyetiMi(String(message || ""))
    ? null
    : (takvimSorusuCoz(message, { saatDilimi }) || takvimTakipCoz(message, sonTakvimAsistan?.content, { saatDilimi }))
  if (!takvim && sesGurultusuMu(message)) {
    // ASR pause ("...") after a true calendar line must not reach the model — it recants.
    return sade("", "", baglam.patientName ? String(baglam.patientName) : null)
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
      await oturumuYaz(hafta.metin, {})
      return sade(hafta.metin, hafta.konusma, baglam.patientName ? String(baglam.patientName) : null)
    } catch (e) {
      console.error("[asistan/chat] takvim hafta", e instanceof Error ? e.message : String(e))
    }
  } else if (takvim) {
    try {
      const satirlar = await doktorunGununuOku(supabase, doktorId, takvim.tarih, saatDilimi)
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
      await oturumuYaz(ozet.metin, {})
      return sade(ozet.metin, konusma, baglam.patientName ? String(baglam.patientName) : null)
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
  let cozum: HastaCozumu | null = null
  // NOTYA-BETA-0925: kimlik / iletişim sorusu (anne-baba adı, veli, telefon, e-posta, adres, doğum yeri/tarihi)
  // sunucuda, modelsiz cevaplanır. Değerler yalnız bu yanıtın ekran metnindedir; saklanan geçmişe (sonraki
  // turlarda modele giden) değersiz metin yazılır — VELI-YASAL-ONAM kuralı korunur.
  let kimlikCevabi: KimlikCevabi | null = null
  if (!kayitNiyetiMi(String(message || ""))) {
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
    return sade(kimlikCevabi.ekran, konusma, kimlikHastasi?.ad || null)
  }
  // NOTYA-SES-OKU-01: "bana anlat / devamını oku" — read the last screen answer aloud, uncapped, no model.
  if (ses && okumaIstegiMi(String(message || ""))) {
    const sonEkran = [...messages].reverse().find((m) => m.role === "assistant" && String(m.content || "").trim())
    if (sonEkran) {
      const tam = konusmaYap(String(sonEkran.content), undefined, { sinirsiz: true }) // screen text is already the cleaned, doctor-visible answer
      const okuma = tam || "Ekranda okunacak bir cevap bulamadım Hocam."
      soyle(okuma)
      const ekranNotu = "Ekrandaki cevabı sesli okudum Hocam."
      await oturumuYaz(ekranNotu, {})
      return sade(ekranNotu, okuma, baglam.patientName ? String(baglam.patientName) : null)
    }
  }

  try {
    // NOTYA-TEK-BEYIN (hız): takip sorusunda aktif hastanın dosyası, mesajdaki hasta çözülürken paralel derlenir;
    // mesaj başka bir hastayı adlandırırsa bu derleme kullanılmaz (doktora kapsanmış bir okuma — sızıntı değil).
    const aktifOnceden = contextPatientId ? String(contextPatientId) : null
    const aktifPaketSozu = aktifOnceden ? dosyaPaketOnbellekli(supabase, doktorId, aktifOnceden).catch(() => null) : null
    cozum = await hastaninSozunuCoz(supabase, doktorId, message, { tz: saatDilimi })
    const mesajMetni = String(message || "")
    // NOTYA-AKTIF-HASTA-01 (Kaan kararı 2026-09-29, 09-25 kuralı geri geldi): açık hasta — bu oturumda adla açılan
    // (odakKaynak 'soz') YA DA doktorun açık sayfası (NOTYA-SAYFA-HASTA-01, 'sayfa') — adsız soruyu cevaplar; arama
    // değil. Adla bulunan hasta kazanır; takvim / çok-hasta sorusu dosya bağlamaz (lib/asistan/aktifHasta.ts).
    const aktifeDon = aktifHastaKullanilsinMi({
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
    const dosyaIstegi = dosyaAcmaIstegiMi(mesajMetni)
    const konus = aktifeDon ? null : cozumKonus(cozum)
    if (konus) {
      aramaCevabi = konus
      // NOTYA-AYSE-100 S2: a who-answer ("Son gördüğünüz hasta: X") makes X the open patient for the follow-up.
      if (cozum.tur === "tek" && cozum.cevap) cozulenHasta = { id: cozum.patientId, ad: cozum.ad }
    } else if (cozum.tur === "yok" && dosyaIstegi) {
      // Never "dosyası açık" without a resolved patient.
      aramaCevabi = "Bu isimde bir hasta bulamadım Hocam; adını ve soyadını tam söyler misiniz?"
    } else if (cozum.tur === "tek" && dosyaIstegi) {
      // Deterministic open: the chart becomes the session's active patient; follow-ups load it from cache.
      cozulenHasta = { id: cozum.patientId, ad: cozum.ad }
      aramaCevabi = `${cozum.ad} dosyası açık Hocam. Ne sormak istersiniz?`
    } else if (cozum.tur === "tek") {
        const soruTuru: SoruTuru | null = soruTuruBul(String(message || ""))
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
          const kesinHam = sorgu ? null : dosyaSoruCevap(String(message || ""), paket.kart as HastaDosyaKart)
          kesinDosyaCevap = kesinHam ? adliDosyaCevabi(aktifAd, kesinHam) : null
          const kesinBlok = kesinDosyaCevap
            ? `\n[KESİN DOSYA CEVABI — bu cümleyi AYNEN söyle, dosyada yoksa uydurma]: ${kesinDosyaCevap}`
            : ""
          dosyaGuvenlikMetni = String(paket.metin || "")
          const sesOzeti = ses && (Boolean(soruTuru) || !sesTamDosyaGerekirMi(String(message || "")))
          dosyaGovde = sesOzeti
            ? `\n\n=== AKTİF HASTA DOSYASI: ${aktifAd} ===\n${hastaOzetiKisa(paket)}\n=== DOSYA SONU ===\n${sesOzetKurali(aktifAd)}`
            : `\n\n=== AKTİF HASTA DOSYASI: ${aktifAd} ===\n${paket.metin}\n=== DOSYA SONU ===\n[KURALLAR: Bu hasta hakkındaki her soruda YALNIZCA yukarıdaki dosyaya ve HIZLI KART'a dayan; her kesin cümleye hastanın adıyla ("${aktifAd}") başla; aşı / ilaç / lab listesini yalnız bu bloktan kur, sohbet geçmişindeki listeden ya da başka hastadan kurma; aşı tablosu ile vizit notları çelişirse ikisini de adıyla söyle; ASLA "uydurdum" / "dayanağı yok" deme; dosyada olmayan bilgiyi uydurma, "dosyada bu bilgi yok Hocam" de. Bu bloktan sonra KESİN DOSYA CEVABI varsa o cümleyi AYNEN söyle. Vizit özetleri yoğun ve yaklaşık 1 dakikada okunur uzunlukta olsun; "kaçıncı ziyaret" sorulursa toplam vizit sayısını ve tarih aralığını söyle. Doktor yeni bir ilaçtan bahsederse hastanın sürekli ilaçlarıyla olası etkileşimi KENDİLİĞİNDEN kontrol et; risk varsa "Hocam, hasta şu an X kullanıyor; Y ile ... riski olabilir" formatında uyar. Kritik dosya bilgilerini (alerji, kronik hastalık, önceki kritik bulgu) yeri geldiğinde kendiliğinden hatırlat. Nihai klinik karar ve sorumluluk doktorundur.]`
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

  if ((aramaCevabi || kesinDosyaCevap) && !kayitNiyetiMi(String(message || ""))) {
    const speech = aramaCevabi || kesinDosyaCevap || ""
    turNiyeti = aramaCevabi && cozum && cozum.tur !== "tek" ? "hasta-sayim" : niyetBul(message) ?? "hasta-dosya"
    await oturumuYaz(speech, { hasta: cozulenHasta })
    const konusma = konusmaYap(speech)
    soyle(konusma)
    return sade(speech, konusma, cozulenHasta?.ad || null)
  }

  // NOTYA-TEK-BEYIN (hız): model turundan önceki okumalar birbirinden bağımsız — sırayla değil, birlikte.
  // NOTYA-EYLEM: hasta kimliği SUNUCUDA çözülür. Bu yüzeyde hasta serbest metinden bulunur
  // (hastaninSozunuCoz) — çözülen hasta belirsizse (cozum.tur === 'coklu') aktifEylemHastasi null
  // kalır, araç sunulmaz ve Ayşe hangi hastayı kastettiğini sorar (docs §2: "ambiguous → ask, no card").
  const eylemHastaId = cozulenHasta?.id || (contextPatientId ? String(contextPatientId) : null)
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
  // NOTYA-RANDEVU-V2: the appointment move/cancel tool only while the doctor's Hasta Portalı Randevu is ON.
  const randevuV2 = eylemHastasi ? await randevuV2Acik(supabase, doktorId) : false
  const araclar = eylemHastasi ? aracTanimlari({ brans: eylemBransi, hasta: eylemHastasi, randevuV2 }) : []
  const toolChoice = araclar.length && kayitNiyetiMi(String(message || augmentedMessage || '')) ? ('any' as const) : undefined
  // NOTYA-LUNA-ARAMA-01 (2026-09-29): with no chart attached the prompt still says "dosyaya erişimin VAR" and
  // forbids "erişemem" — a compliant model then invents a file ("dosyası açık", made-up aşı/ilaç). Say it plainly.
  // Only when NO patient could be resolved at all (no name, no open patient) — an open patient without a chart this
  // turn (cohort / calendar question) is still a known patient.
  const dosyaYokBlogu = !dosyaEk && !currentPatient ? DOSYA_YOK_BLOGU : ""
  // NOTYA-AYSE-100-LUNA (c): the model clock — doctor-timezone date/time, per turn, never cached.
  // NOTYA-KONUSMA-BAGLAMI-01: the previous turn's topic for the residual model-path questions (≈ 200 tokens, per turn).
  const kuyruk = zamanBlogu(saatDilimi) + baglamBlogu(konusmaOnceki) + gunHam + dosyaTur + dosyaYokBlogu + (araclar.length ? EYLEM_ISTEM_BLOGU : "")

  // KD-DERM-SAFETY-FINDINGS F1 + CROSS-SPECIALTY-PARITY: a dose the doctor did not type (and that is not in the patient
  // file / verified drug context) never reaches the chat bubble — for EVERY branch, not only the prompt-locked chapters.
  const dozKaynak = kaynakSayilari(augmentedMessage, dosyaEk, odakDosyaMetni, ...messages.filter((m) => m.role === "user").map((m) => m.content))
  const kdMi = kadinDogumMi(hekimBransi, specialty)
  const liste = kdMi ? kdDogrulanmisKaynaklar() : []
  // Ses: model yazarken her cümle ekrandakiyle aynı kilitlerden geçer — doğrulanmamış doz / kılavuz numarası söylenmez.
  const sesTemizle = (c: string) => {
    let t = uydurmaDozTemizle(doktorMetniTemizle(c), dozKaynak).metin
    if (kdMi) t = uydurmaKaynakTemizle(t, liste).metin
    return t
  }
  // NOTYA-SES-DEVAM-01: with a continuation behind it the cap is silent — the remainder comes in the next turn.
  const sesAkisi = ses && g.sozParcasi ? new SesAkisi(g.sozParcasi, sesTemizle, g.sesSiniri, sesSiniriSec(kanitYoluAktif), Boolean(g.sesDurumu)) : null

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
    ]
  }
  // NOTYA-KADEME-01: sosyal tur ve tek-slot kısa takip turu luna-none (effort none); araç / eylem / ağır soru luna.
  const kademe = sohbetKademesi({
    gorev: yonlendirme.gorev, mesaj: String(message || ""), sonNiyet: takip?.niyet ?? konusmaOnceki?.sonNiyet ?? null,
    niyet: quickIntent, aracSayisi: araclar.length, girdiToken: girdiTokenTahmini(cagriTaban),
  })
  const cagri = kademe.caba ? { ...cagriTaban, caba: kademe.caba } : cagriTaban
  let akanHam = ""
  const response = sesAkisi
    ? await aiAkis(cagri, (p) => { akanHam += p; sesAkisi.ekle(speechOneki(akanHam)) })
    : await aiCagir(cagri)

  // NOTYA-AYSE-100 M1: the text block is not always first (tool_use first, thinking first) — join every text block.
  const rawResponse = yanitMetni(response)

  // KD-DERM-SAFETY-FINDINGS F3: never raw JSON to the doctor — a max_tokens cut is salvaged (speech up to the cut +
  // "yanıt kesildi" note) and a half-written action is dropped.
  const aiData = asistanYanitiCoz(rawResponse, response.stop_reason)
  if (aiData.kesildi) console.warn("[asistan/chat] yanıt kesildi", { stop_reason: response.stop_reason, uzunluk: rawResponse.length })
  // KD-DERM-SAFETY-FINDINGS F4: no internal field names / invented consent form numbers in the bubble
  aiData.speech = doktorMetniTemizle(aiData.speech)
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
  const odakAd = odakHastaAdi || (cozulenHasta?.ad ?? (baglam.patientName ? String(baglam.patientName) : ''))
  const odak = hastaOdakTemizle(String(aiData.speech || ''), odakAd ? { ad: odakAd, dosyaMetni: odakDosyaMetni || dosyaEk, kanitYolu: kanitYoluAktif } : null)
  if (odak.ihlal.length) console.warn("[asistan/chat] hasta odak kilidi", { ihlal: odak.ihlal, ad: odakAd })
  aiData.speech = odak.metin
  if (takvimRecantMi(aiData.speech)) {
    const sonTakvim = [...messages].reverse().find((m) => m.role === "assistant" && sonTakvimCevabiMi(m.content))
    if (sonTakvim) aiData.speech = String(sonTakvim.content)
  }

  // Ses: modelin cevabı söylendi (ya da akış yoksa şimdi kurulur); aşağıdaki ekler (yönlendirme, kart okuması) sona eklenir.
  const sozler: string[] = []
  if (ses) sozler.push(sesAkisi ? sesAkisi.bitir() : konusmaYap(aiData.speech, sesTemizle))
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
  const eylemCtx = (h: HastaOzeti) => ({ supabase, doktorId, hasta: h, brans: eylemBransi, oneriId: "", bugunTRT: bugunTRT() })
  const eylemOnerileri: HazirOneri[] = eylemHastasi
    // NOTYA-EYLEM-21: Ayşe'nin kendi uyarı cümlesi karta "Ayşe'nin notu" olarak taşınır — deterministik
    // kontrolün yerine değil, yanına; asla `ciddi` sayılmaz (core/eylemler/ilacUyari.ts).
    ? await toolUseOnerileri(response as unknown as { content?: unknown }, eylemCtx(eylemHastasi), yuzey, { brans: eylemBransi, hasta: eylemHastasi, randevuV2 }, aiData.proactiveWarning)
    : []

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
          suzgec: { brans: eylemBransi, hasta: eylemHastasi, randevuV2 },
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
    if (ses && eylemHastasi) sozEkle(kartOkumasi(eylemOnerileri, eylemHastasi.ad))
  }
  // NOTYA-AYSE-100 M1: a tool-only turn left the screen blank; a model turn with no text and no card says so.
  if (!String(aiData.speech || "").trim()) {
    aiData.speech = eylemOnerileri.length && eylemHastasi
      ? kartOkumasi(eylemOnerileri, eylemHastasi.ad)
      : "Bu soruya şu an cevap üretemedim Hocam; bir daha sorar mısınız?"
    if (ses && !sozler.some(Boolean)) sozEkle(konusmaYap(aiData.speech))
  }

  // NOTYA-SES-DEVAM-01 (Dr. Gökhan: "özet yarıda kesilmesin"): the voice turn closed before everything was said
  // (5-sentence cap or the 22 s guard) → the unspoken rest, uncapped, waits for the page's hidden [devam] turn.
  let sesDevamKalan = ""
  const durum = ses ? g.sesDurumu?.() : undefined
  if (durum?.kesildi) {
    sesDevamKalan = sesDevamKalani([...sozCumleleri(String(aiData.speech || ""), sesTemizle), ...sozler.slice(1)], durum.soylenen)
  }

  // Update conversation history
  turNiyeti = turNiyeti ?? niyetBul(message) ?? (dosyaEk || currentPatient ? "hasta-dosya" : "genel")
  await oturumuYaz(String(aiData.speech), { hasta: cozulenHasta, kartlar: eylemOnerileri.map((o) => o.id), kartHastaId: eylemHastasi?.id ?? null, bekleyen, sesDevamKalan })

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

  return {
    ok: true,
    cevap: {
      ekran: aiData.speech,
      konusma: sozler.filter(Boolean).join(" ").trim(),
      kartlar: eylemOnerileri,
      kartHastaId: eylemOnerileri.length ? eylemHastasi?.id ?? null : null,
      oncekiBekleyen: Array.isArray(baglam.bekleyenOneriler) ? baglam.bekleyenOneriler.map(String) : [],
      aktifHasta: cozulenHasta?.ad || null,
      oturumId,
      veri: {
        eylemOnerileri,
        eylemYonlendirme,
        eylemHastasi: eylemHastasi ? { ad: eylemHastasi.ad, dogumTarihi: eylemHastasi.dogumTarihi } : null,
        speech: aiData.speech,
        proactiveWarning: aiData.proactiveWarning,
        action: aiData.action,
        actionResult,
        asistanSessionId: oturumId,
        aktifHasta: cozulenHasta?.ad || null,
        personaId,
        personaName: persona.name,
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
  if (k.hasta) return `${k.hasta.ad} için istediğiniz bilgiyi ekranınıza yazdım Hocam.`
  return konusmaYap(k.ekran)
}

/** Kart(lar) için sözlü okuma — "Kart ekranda. Henüz dosyaya yazılmadı. Onaylıyor musunuz?" (ses-eylem ile aynı cümle). */
function kartOkumasi(kartlar: HazirOneri[], hastaAd: string): string {
  if (kartlar.length > 1) return `${hastaAd} için ${kartlar.length} kayıt kartı hazırladım, ekranda. Henüz dosyaya yazılmadı. Ekrandan onaylayın ya da tek tek söyleyin.`
  const o = kartlar[0]
  return sesOzetMetni({ etiket: o.etiket, hastaAd, veri: o.veri, alanlar: o.alanlar, eksik: o.eksik_alanlar.filter((a) => o.zorunlu.includes(a)), ek: (o.uyarilar || []).join(' ') })
}

