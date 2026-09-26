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
import Anthropic from "@anthropic-ai/sdk"
import { PERSONAS, varsayilanPersonaId, buildSystemPromptParcalari, type PersonaId } from "@/lib/asistan/personaEngine"
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
import { hastaDosyaPaketiniDerle } from "@/lib/doktor/hastaDosyaDerleyici"
import { adliDosyaCevabi, dosyaSoruCevap } from "@/lib/doktor/hastaDosyaKart"
import { kimlikSorusunuCevapla, type KimlikCevabi } from "@/lib/doktor/kimlikSorusu"
import { aiKotaKullan, KOTA_MESAJI } from "@/lib/doktor/hizLimiti"
import { quickClassify, extractPrescriptionData } from "@/lib/asistan/intentParser"
import { executeAction, eskiEylemKarari, type ActionResult } from "@/lib/asistan/actionExecutor"
import { searchDrug, ilacBaglamMetni } from "@/lib/asistan/turkishDrugs"
import { toAddressableUser, type DoctorProfile } from "@/lib/userProfile"
import { hafizaYukle, hafizaBloguSohbet, seansIsle, ogrenmeyeDeger, sohbettenOgren, ozetGerekirseGuncelle } from "@/lib/doktor/hafiza"
import { hastaSahibiMi } from "@/lib/doktor/hastaSahipligi"
import { aiAkis, aiCagir } from "@/lib/ai/cagir"
import { asistanModelYonlendir, gecmisiKirp, SOHBET_SAKLANAN_MESAJ } from "@/lib/ai/modeller"
import { aracTanimlari, eylemKapali } from "@/core/eylemler/araclar"
import { toolUseOnerileri, oneriHazirla, kayitNiyetiMi, type HazirOneri } from "@/core/eylemler/oneri"
import { hastaOzetiGetir } from "@/core/eylemler/hasta"
import { EYLEM_ISTEM_BLOGU } from "@/core/eylemler/istem"
import { bugunTRT, type HastaOzeti } from "@/core/eylemler/types"
import { sesOzetMetni } from "@/core/eylemler/sesKapilari"
import { bransAnahtari } from "@/lib/specialties/bransAnahtari"
import { konusmaYap, okumaIstegiMi, SesAkisi, SOZ_BEAT_SINIRI, sozCumleleri, sesDevamKalani } from "@/lib/asistan/konusma"
import { aktifHastaKullanilsinMi } from "@/lib/asistan/aktifHasta"
import { soruTuruBul, type SoruTuru } from "@/lib/asistan/dosyaSorgu/soruTuru"
import { kanitBlogu } from "@/lib/asistan/dosyaSorgu/kanit"
import { dosyaSorguKuralBlogu } from "@/lib/asistan/dosyaSorgu/kurallar"
import { dosyaSorguVerisiDerle } from "@/lib/doktor/dosyaOlaylari"

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

const getAnthropic = () => new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const simdi = () => new Date().toISOString()

export async function ayseCevapla(g: AyseGirdisi): Promise<AyseSonucu> {
  const supabase = g.supabase
  const doktorId = g.doktorId
  const message = g.mesaj
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

  const personaId = (asistanSession?.persona_id as PersonaId) || varsayilanPersonaId(specialty, hekimBransi)
  const persona = PERSONAS[personaId] || PERSONAS[varsayilanPersonaId(specialty, hekimBransi)]
  if (!persona) {
    return { ok: false, durum: 500, govde: { error: "Uzman persona bulunamadı" }, soz: "Şu an cevap veremiyorum Hocam." }
  }

  const baglam = (asistanSession?.active_context as Record<string, unknown>) || {}
  const contextPatientId = baglam.currentPatientId || patientId
  const messages: OturumMesaji[] = (asistanSession?.messages as OturumMesaji[]) || []
  const oturumId = (asistanSession?.id as string) || null

  /** Tek yazma noktası: geçmiş + (varsa) çözülen hasta + (varsa) bekleyen kart listesi. */
  const oturumuYaz = async (asistanSozu: string, ek: { hasta?: { id: string; ad: string } | null; kartlar?: string[]; kartHastaId?: string | null; kimlik?: boolean; bekleyen?: string[]; sesDevamKalan?: string } = {}) => {
    const kullanici: OturumMesaji = ses ? { role: "user", content: message, kanal: "ses", zaman: simdi() } : { role: "user", content: message }
    const asistanZamani = simdi()
    const asistan: OturumMesaji = ses
      ? {
          role: "assistant", content: asistanSozu, kanal: "ses", zaman: asistanZamani,
          ...(ek.kartlar?.length ? { kartlar: ek.kartlar, hastaId: ek.kartHastaId ?? null } : {}),
          ...(ek.kimlik ? { kimlik: true, hastaId: ek.hasta?.id ?? (contextPatientId ? String(contextPatientId) : null) } : {}),
        }
      : { role: "assistant", content: asistanSozu }
    // NOTYA-SES-DEVAM-01: a new real doctor turn drops the previous turn's unspoken remainder.
    const { sesDevam: eskiDevam, ...oncekiBaglam } = baglam
    const sesDevam: SesDevam | null = ses && ek.sesDevamKalan ? { anahtar: asistanZamani, kalan: ek.sesDevamKalan, olusturma: simdi() } : null
    // NOTYA-SAYFA-HASTA-01: the doctor opened another patient's page while this turn ran (a voice turn can take
    // 30 s) — that page switch is the more recent explicit signal; this write must not put the old focus back.
    let sayfaOdagi: Record<string, unknown> | null = null
    if (ek.hasta || ek.bekleyen || eskiDevam || sesDevam) {
      const { data: taze } = await supabase.from("asistan_sessions").select("active_context").eq("id", oturumId).eq("doctor_id", doktorId).maybeSingle()
      const t = ((taze as { active_context?: Record<string, unknown> | null } | null)?.active_context || {}) as Record<string, unknown>
      if (t.odakKaynak === "sayfa" && t.currentPatientId && String(t.odakZaman || "") > turBaslangic) {
        sayfaOdagi = { currentPatientId: t.currentPatientId, patientName: t.patientName ?? null, odakKaynak: "sayfa", odakZaman: t.odakZaman }
      }
    }
    const yeniBaglam = ek.hasta || ek.bekleyen || eskiDevam || sesDevam
      ? {
          ...oncekiBaglam,
          ...(ek.hasta ? { currentPatientId: ek.hasta.id, patientName: ek.hasta.ad, odakKaynak: "soz", odakZaman: asistanZamani } : {}),
          ...(ek.bekleyen ? { bekleyenOneriler: ek.bekleyen } : {}),
          ...(sesDevam && !sayfaOdagi ? { sesDevam } : {}),
          ...(sayfaOdagi || {}),
        }
      : null
    await supabase.from("asistan_sessions").update({
      messages: [...messages, kullanici, asistan].slice(-SOHBET_SAKLANAN_MESAJ),
      ...(sayfaOdagi ? { patient_id: sayfaOdagi.currentPatientId } : ek.hasta ? { patient_id: ek.hasta.id } : {}),
      ...(yeniBaglam ? { active_context: yeniBaglam } : {}),
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

  // Quick classify intent for faster response
  const quickIntent = quickClassify(message)
  let augmentedMessage = message

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
    const aktifPaketSozu = aktifOnceden ? hastaDosyaPaketiniDerle(supabase, doktorId, aktifOnceden).catch(() => null) : null
    cozum = await hastaninSozunuCoz(supabase, doktorId, message)
    // NOTYA-AKTIF-HASTA-01: with a patient open, an unnamed question is about that patient, not a search.
    const aktifeDon = aktifHastaKullanilsinMi({
      aktifHastaVar: Boolean(aktifOnceden),
      cozumTur: cozum.tur,
      aramaSonucu: Boolean((cozum as { sayiMetin?: string }).sayiMetin),
      mesaj: String(message || ''),
    })
    const konus = aktifeDon ? null : cozumKonus(cozum)
    if (konus) {
      aramaCevabi = konus
    } else {
      const aktifId = cozum.tur === "tek" ? cozum.patientId : aktifOnceden
      if (aktifId) {
        // NOTYA-AYSE-STANDART-01: açık hasta + 10 kanonik dosya sorusundan biri → olay dizini (planlandı ≠ uygulandı)
        // dosya paketiyle birlikte, paralel derlenir. Olay okumaları da doktora kapsanır (dosyaOlaylari).
        const soruTuru: SoruTuru | null = soruTuruBul(String(message || ""))
        const sorguSozu = soruTuru ? dosyaSorguVerisiDerle(supabase, doktorId, aktifId).catch(() => null) : null
        const paket = aktifId === aktifOnceden && aktifPaketSozu ? await aktifPaketSozu : await hastaDosyaPaketiniDerle(supabase, doktorId, aktifId)
        const sorgu = sorguSozu ? await sorguSozu : null
        if (paket) {
          if (cozum.tur === "tek") cozulenHasta = { id: cozum.patientId, ad: cozum.ad }
          const aktifAd = cozum.tur === "tek" ? cozum.ad : (paket.ad || "aktif hasta")
          // NOTYA-HASTA-ODAK-01 (Dr. Gökhan canlı vaka, 2026-09-26): "Dosyada aşı: kayıtlı aşı yok" doğruydu ama
          // BAŞKA hastanın dosyasıydı ve cümlede ad yoktu — doktor konuştuğu hasta sanıp "aşı yok deyip aşıları
          // gösterdi" dedi. Kesin dosya cevabı her zaman hastanın adıyla başlar; yanlış hasta anında görülür.
          // NOTYA-AYSE-STANDART-01: dosya sorusu (özet, aşı tam mı, ilaçlar, açık işler…) HIZLI KART'la cevaplanmaz —
          // kart tek bilgilik sorular içindir (kan grubu, alerji, son vizit tarihi, telefon / kimlik).
          const kesinHam = sorgu ? null : dosyaSoruCevap(String(message || ""), paket.kart)
          kesinDosyaCevap = kesinHam ? adliDosyaCevabi(aktifAd, kesinHam) : null
          const kesinBlok = kesinDosyaCevap
            ? `\n[KESİN DOSYA CEVABI — bu cümleyi AYNEN söyle, dosyada yoksa uydurma]: ${kesinDosyaCevap}`
            : ""
          dosyaEk = `\n\n=== AKTİF HASTA DOSYASI: ${aktifAd} ===\n${paket.metin}\n=== DOSYA SONU ===${kesinBlok}\n[KURALLAR: Bu hasta hakkındaki her soruda YALNIZCA yukarıdaki dosyaya ve HIZLI KART'a dayan; her kesin cümleye hastanın adıyla ("${aktifAd}") başla; aşı / ilaç / lab listesini yalnız bu bloktan kur, sohbet geçmişindeki listeden ya da başka hastadan kurma; aşı tablosu ile vizit notları çelişirse ikisini de adıyla söyle; ASLA "uydurdum" / "dayanağı yok" deme; dosyada olmayan bilgiyi uydurma, "dosyada bu bilgi yok Hocam" de. Vizit özetleri yoğun ve yaklaşık 1 dakikada okunur uzunlukta olsun; "kaçıncı ziyaret" sorulursa toplam vizit sayısını ve tarih aralığını söyle. Doktor yeni bir ilaçtan bahsederse hastanın sürekli ilaçlarıyla olası etkileşimi KENDİLİĞİNDEN kontrol et; risk varsa "Hocam, hasta şu an X kullanıyor; Y ile ... riski olabilir" formatında uyar. Kritik dosya bilgilerini (alerji, kronik hastalık, önceki kritik bulgu) yeri geldiğinde kendiliğinden hatırlat. Nihai klinik karar ve sorumluluk doktorundur.]`
          if (sorgu && soruTuru) {
            dosyaEk += `${dosyaSorguKuralBlogu(aktifAd)}\n${kanitBlogu(soruTuru, sorgu.olaylar, sorgu.hasta, { mesaj: String(message || "") })}`
          }
        }
      }
    }
  } catch { /* dosya bağlamı kritik değil — normal akış sürer */ }

  if ((aramaCevabi || kesinDosyaCevap) && !kayitNiyetiMi(String(message || ""))) {
    const speech = aramaCevabi || kesinDosyaCevap || ""
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
    contextPatientId
      ? supabase.from("patients").select("*").eq("id", contextPatientId).eq("doctor_id", doktorId).maybeSingle().then((r) => r.data)
      : Promise.resolve(null),
    eylemKapali() ? Promise.resolve(null) : hastaOzetiGetir(supabase, doktorId, eylemHastaId),
  ])
  if (!kota.izin) return { ok: false, durum: 429, govde: { success: false, error: KOTA_MESAJI }, soz: KOTA_MESAJI }
  const hafizaBlogu = hafizaHam + gunHam

  // Build system prompt with learning context
  // DAH-/KD-/DERM-PROMPTS-LOCK: branş hekimi (users.specialty) → specialties/<branş>/prompts kilidi (system.md + tools.ts)
  const bransKilidi = dahiliyeMi(hekimBransi, specialty) ? dahiliyeKilidi("asistan") : kadinDogumMi(hekimBransi, specialty) ? kadinDogumKilidi("asistan") : dermatolojiMi(hekimBransi, specialty) ? dermatolojiKilidi("asistan") : gozMi(hekimBransi, specialty) ? gozKilidi("asistan") : ""
  // NOTYA-MALIYET-01 (prompt caching): metin ve sıra eskisiyle birebir aynı (buildSystemPrompt + bransKilidi + dosyaEk).
  // 1. kırılma noktası: persona/know-how/kurallar (hekim × persona başına sabit). 2. kırılma noktası: tüm system — hafıza,
  // aktif hasta, branş kilidi ve dosya aynı sohbette turdan tura değişmez (yalnız ilk turda gün bloğu var).
  // Branş kilidi BİLEREK sabit bloğa taşınmadı: kilit "yukarıdaki talimatlarla çeliştiğinde ÖNCELİKLİDİR" der; hafıza
  // ve hasta bloğunun üstüne çıkarsa önceliği onları kapsamaz (kalite riski).
  const sistem = buildSystemPromptParcalari(persona, prefs, currentPatient, doctorProfile, hafizaBlogu)

  // NOTYA-MALIYET-01 (Kaan, 2026-09-19): ŞÜPHEDE GÜÇLÜ. Hasta bağlamı, eylem niyeti, klinik sinyal ya da belirsiz mesaj →
  // GÜÇLÜ (Sonnet, 1600 token — F3). HIZLI yalnız net sosyal tur / uygulama kullanımı sorusu. Kural: lib/ai/modeller.ts.
  const yonlendirme = asistanModelYonlendir({ mesaj: String(message || ""), hastaBaglami: Boolean(dosyaEk) || Boolean(currentPatient), niyet: quickIntent })

  const eylemBransi = bransAnahtari(hekimBransi)
  const araclar = eylemHastasi ? aracTanimlari({ brans: eylemBransi, hasta: eylemHastasi }) : []
  const toolChoice = araclar.length && kayitNiyetiMi(String(message || augmentedMessage || '')) ? ('any' as const) : undefined

  // KD-DERM-SAFETY-FINDINGS F1 + CROSS-SPECIALTY-PARITY: a dose the doctor did not type (and that is not in the patient
  // file / verified drug context) never reaches the chat bubble — for EVERY branch, not only the prompt-locked chapters.
  const dozKaynak = kaynakSayilari(augmentedMessage, dosyaEk, ...messages.filter((m) => m.role === "user").map((m) => m.content))
  const kdMi = kadinDogumMi(hekimBransi, specialty)
  const liste = kdMi ? kdDogrulanmisKaynaklar() : []
  // Ses: model yazarken her cümle ekrandakiyle aynı kilitlerden geçer — doğrulanmamış doz / kılavuz numarası söylenmez.
  const sesTemizle = (c: string) => {
    let t = uydurmaDozTemizle(doktorMetniTemizle(c), dozKaynak).metin
    if (kdMi) t = uydurmaKaynakTemizle(t, liste).metin
    return t
  }
  // NOTYA-SES-DEVAM-01: with a continuation behind it the cap is silent — the remainder comes in the next turn.
  const sesAkisi = ses && g.sozParcasi ? new SesAkisi(g.sozParcasi, sesTemizle, g.sesSiniri, SOZ_BEAT_SINIRI, Boolean(g.sesDurumu)) : null

  const cagri = {
    istemci: getAnthropic(),
    gorev: yonlendirme.gorev,
    doctorId: doktorId,
    araclar,
    toolChoice,
    system: [
      { metin: sistem.sabit, onbellek: true },
      { metin: sistem.degisken + bransKilidi + dosyaEk + (araclar.length ? EYLEM_ISTEM_BLOGU : ""), onbellek: true },
    ],
    messages: [
      // modele son 8 mesaj (4 tur) gider; saklanan geçmiş ve doz-kaynak kontrolü tam listeyi kullanır
      ...gecmisiKirp(messages).map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content
      })),
      { role: "user" as const, content: augmentedMessage }
    ]
  }
  let akanHam = ""
  const response = sesAkisi
    ? await aiAkis(cagri, (p) => { akanHam += p; sesAkisi.ekle(speechOneki(akanHam)) })
    : await aiCagir(cagri)

  const rawResponse = response.content[0]?.type === "text" ? response.content[0].text : ""

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

  // Ses: modelin cevabı söylendi (ya da akış yoksa şimdi kurulur); aşağıdaki ekler (yönlendirme, kart okuması) sona eklenir.
  const sozler: string[] = []
  if (ses) sozler.push(sesAkisi ? sesAkisi.bitir() : konusmaYap(aiData.speech, sesTemizle))
  const sozEkle = (s: string) => { if (!ses || !s) return; sozler.push(s); soyle(s) }

  // NOTYA-EYLEM: tool_use → taslak öneri + onay kartı. Hiçbir şey yazılmadı; hekim onaylayacak.
  const yuzey = ses ? "ses" as const : "sohbet" as const
  const eylemCtx = (h: HastaOzeti) => ({ supabase, doktorId, hasta: h, brans: eylemBransi, oneriId: "", bugunTRT: bugunTRT() })
  const eylemOnerileri: HazirOneri[] = eylemHastasi
    // NOTYA-EYLEM-21: Ayşe'nin kendi uyarı cümlesi karta "Ayşe'nin notu" olarak taşınır — deterministik
    // kontrolün yerine değil, yanına; asla `ciddi` sayılmaz (core/eylemler/ilacUyari.ts).
    ? await toolUseOnerileri(response as unknown as { content?: unknown }, eylemCtx(eylemHastasi), yuzey, { brans: eylemBransi, hasta: eylemHastasi }, aiData.proactiveWarning)
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
    if (ses && eylemHastasi) sozEkle(kartOkumasi(eylemOnerileri, eylemHastasi.ad))
  }

  // NOTYA-SES-DEVAM-01 (Dr. Gökhan: "özet yarıda kesilmesin"): the voice turn closed before everything was said
  // (5-sentence cap or the 22 s guard) → the unspoken rest, uncapped, waits for the page's hidden [devam] turn.
  let sesDevamKalan = ""
  const durum = ses ? g.sesDurumu?.() : undefined
  if (durum?.kesildi) {
    sesDevamKalan = sesDevamKalani([...sozCumleleri(String(aiData.speech || ""), sesTemizle), ...sozler.slice(1)], durum.soylenen)
  }

  // Update conversation history
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

  // NOTYA-OGRENME-03: ilişki sayacı (seans = farklı gün, mesaj başına değil) + öğrenme.
  // Haiku yalnız doktor kendinden/tercihinden bahsettiğinde çağrılır (regex kapısı — ekonomi).
  try {
    const iliski = await seansIsle(supabase, doktorId, "sohbet")
    if (ogrenmeyeDeger(String(message || ""))) {
      await sohbettenOgren(getAnthropic(), supabase, doktorId, [
        ...messages.slice(-4).map((m: { role: string; content: string }) => ({ role: m.role, content: m.content })),
        { role: "user", content: String(message) },
        { role: "assistant", content: aiData.speech },
      ])
    }
    if (iliski.seans_sayisi >= 5 && iliski.seans_sayisi - iliski.ozet_seans >= 5) {
      await ozetGerekirseGuncelle(getAnthropic(), supabase, doktorId)
    }
  } catch (e) { console.error("[hafiza] sohbet", e) }

  // Miras sayaç (doctor_preferences) — last_session_at
  if (!prefs) {
    await supabase.from("doctor_preferences").insert({ doctor_id: doktorId, sessions_completed: 1, last_session_at: new Date().toISOString() })
  } else {
    await supabase.from("doctor_preferences").update({ last_session_at: new Date().toISOString() }).eq("doctor_id", doktorId)
  }

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

