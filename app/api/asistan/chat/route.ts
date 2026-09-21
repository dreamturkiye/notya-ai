
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
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
import { asistanYanitiCoz } from "@/lib/asistan/yanitCoz"
import { doktorMetniTemizle } from "@/lib/doktor/klinikMetin"
import { cozumKonus, hastaninSozunuCoz } from "@/lib/doktor/hastaCozumleyici"
import { hastaDosyaPaketiniDerle } from "@/lib/doktor/hastaDosyaDerleyici"
import { dosyaSoruCevap } from "@/lib/doktor/hastaDosyaKart"
import { aiKotaKullan, KOTA_MESAJI } from "@/lib/doktor/hizLimiti"
import { quickClassify, extractPatientData, extractPrescriptionData } from "@/lib/asistan/intentParser"
import { executeAction, eskiEylemKarari, type ActionResult } from "@/lib/asistan/actionExecutor"
import { searchDrug, ilacBaglamMetni } from "@/lib/asistan/turkishDrugs"
import { toAddressableUser, type DoctorProfile } from "@/lib/userProfile"
import { hafizaYukle, hafizaBloguSohbet, seansIsle, ogrenmeyeDeger, sohbettenOgren, ozetGerekirseGuncelle } from "@/lib/doktor/hafiza"
import { hastaSahibiMi } from "@/lib/doktor/hastaSahipligi"
import { aiCagir } from "@/lib/ai/cagir"
import { asistanModelYonlendir, gecmisiKirp, SOHBET_SAKLANAN_MESAJ } from "@/lib/ai/modeller"
import { aracTanimlari, eylemKapali } from "@/core/eylemler/araclar"
import { toolUseOnerileri, oneriHazirla, kayitNiyetiMi, type HazirOneri } from "@/core/eylemler/oneri"
import { hastaOzetiGetir } from "@/core/eylemler/hasta"
import { EYLEM_ISTEM_BLOGU } from "@/core/eylemler/istem"
import { bugunTRT } from "@/core/eylemler/types"
import { bransAnahtari } from "@/lib/specialties/bransAnahtari"

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, { global: { fetch: (u, o) => fetch(u, { ...o, cache: 'no-store' }) } }
)
const getAnthropic = () => new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: NextRequest) {
  try {
    // Auth
    const authHeader = req.headers.get("Authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Yetkisiz" }, { status: 401 })
    }
    const { data: { user } } = await getSupabase().auth.getUser(authHeader.split(" ")[1])
    if (!user) return NextResponse.json({ success: false, error: "Geçersiz token" }, { status: 401 })

    const body = await req.json()
    const {
      message,
      asistanSessionId,
      patientId,
      sessionId,
      specialty = "genel",
      personaId: requestedPersona,
    } = body

    // HASTA-IZOLASYON-01: the patient context comes from the request — it must be this doctor's patient
    // before it is stored on the assistant session or put into the model prompt.
    if (patientId && !(await hastaSahibiMi(getSupabase(), user.id, String(patientId)))) {
      return NextResponse.json({ success: false, error: "Hasta bulunamadı" }, { status: 404 })
    }

    // Load doctor profile for Hocam addressing
    const { data: doctorRow } = await getSupabase()
      .from("users")
      .select("*")
      .eq("id", user.id)
      .maybeSingle()
    const doctorProfile = toAddressableUser(doctorRow as DoctorProfile | null)
    // DAH-/KD-/DERM-PROMPTS-LOCK + ASISTAN-PERSONA-BRANS: users.specialty drives the branch lock and the default colleague
    const hekimBransi = (doctorRow as { specialty?: string } | null)?.specialty

    // Load doctor preferences
    const { data: prefs } = await getSupabase()
      .from("doctor_preferences")
      .select("*")
      .eq("doctor_id", user.id)
      .single()

    // Load or create asistan session
    let asistanSession: Record<string, unknown> | null = null
    if (asistanSessionId) {
      const { data } = await getSupabase()
        .from("asistan_sessions")
        .select("*")
        .eq("id", asistanSessionId)
        .eq("doctor_id", user.id)
        .single()
      asistanSession = data
    }

    if (!asistanSession) {
      // doctor_preferences.preferred_persona is not read: nothing ever writes it, every row holds the schema default
      // 'elifsahin' (nöroloji), so from their 2nd chat every doctor got the neurology colleague (ASISTAN-PERSONA-BRANS).
      // The doctor's real pick arrives as personaId (asistan page tab, localStorage).
      const personaId: PersonaId = requestedPersona || varsayilanPersonaId(specialty, hekimBransi)
      const { data } = await getSupabase()
        .from("asistan_sessions")
        .insert({
          doctor_id: user.id,
          patient_id: patientId || null,
          session_id: sessionId || null,
          persona_id: personaId,
          messages: [],
          active_context: { specialty, currentPatientId: patientId }
        })
        .select().single()
      asistanSession = data
    }

    const personaId = (asistanSession?.persona_id as PersonaId) || varsayilanPersonaId(specialty, hekimBransi)
    const persona = PERSONAS[personaId] || PERSONAS[varsayilanPersonaId(specialty, hekimBransi)]
    if (!persona) {
      return NextResponse.json({ error: "Uzman persona bulunamadı" }, { status: 500 })
    }

    // Load current patient if any
    let currentPatient = null
    const contextPatientId = (asistanSession?.active_context as Record<string, unknown>)?.currentPatientId || patientId
    if (contextPatientId) {
      // HASTA-IZOLASYON-01: patientId comes from the request body — only this doctor's patient enters the prompt.
      const { data } = await getSupabase()
        .from("patients")
        .select("*")
        .eq("id", contextPatientId)
        .eq("doctor_id", user.id)
        .maybeSingle()
      currentPatient = data
    }

    // Build conversation history
    const messages: { role: string; content: string }[] = (asistanSession?.messages as { role: string; content: string }[]) || []

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
    try {
      const cozum = await hastaninSozunuCoz(getSupabase(), user.id, message)
      const konus = cozumKonus(cozum)
      if (konus) {
        aramaCevabi = konus
      } else {
        const aktifId = cozum.tur === "tek" ? cozum.patientId : (contextPatientId ? String(contextPatientId) : null)
        if (aktifId) {
          const paket = await hastaDosyaPaketiniDerle(getSupabase(), user.id, aktifId)
          if (paket) {
            if (cozum.tur === "tek") cozulenHasta = { id: cozum.patientId, ad: cozum.ad }
            const aktifAd = cozum.tur === "tek" ? cozum.ad : "aktif hasta"
            kesinDosyaCevap = dosyaSoruCevap(String(message || ""), paket.kart)
            const kesinBlok = kesinDosyaCevap
              ? `\n[KESİN DOSYA CEVABI — bu cümleyi AYNEN söyle, dosyada yoksa uydurma]: ${kesinDosyaCevap}`
              : ""
            dosyaEk = `\n\n=== AKTİF HASTA DOSYASI: ${aktifAd} ===\n${paket.metin}\n=== DOSYA SONU ===${kesinBlok}\n[KURALLAR: Bu hasta hakkındaki her soruda YALNIZCA yukarıdaki dosyaya ve HIZLI KART'a dayan; dosyada olmayan bilgiyi uydurma, "dosyada bu bilgi yok Hocam" de. Vizit özetleri yoğun ve yaklaşık 1 dakikada okunur uzunlukta olsun; "kaçıncı ziyaret" sorulursa toplam vizit sayısını ve tarih aralığını söyle. Doktor yeni bir ilaçtan bahsederse hastanın sürekli ilaçlarıyla olası etkileşimi KENDİLİĞİNDEN kontrol et; risk varsa "Hocam, hasta şu an X kullanıyor; Y ile ... riski olabilir" formatında uyar. Kritik dosya bilgilerini (alerji, kronik hastalık, önceki kritik bulgu) yeri geldiğinde kendiliğinden hatırlat. Nihai klinik karar ve sorumluluk doktorundur.]`
          }
        }
      }
    } catch { /* dosya bağlamı kritik değil — normal akış sürer */ }

    if ((aramaCevabi || kesinDosyaCevap) && !kayitNiyetiMi(String(message || ""))) {
      const speech = aramaCevabi || kesinDosyaCevap || ""
      const updatedMessages = [
        ...messages,
        { role: "user", content: message },
        { role: "assistant", content: speech },
      ].slice(-SOHBET_SAKLANAN_MESAJ)
      await getSupabase().from("asistan_sessions").update({
        messages: updatedMessages,
        ...(cozulenHasta ? {
          patient_id: cozulenHasta.id,
          active_context: {
            ...(asistanSession?.active_context as Record<string, unknown> || {}),
            currentPatientId: cozulenHasta.id,
            patientName: cozulenHasta.ad,
          },
        } : {}),
      }).eq("id", asistanSession?.id)
      return NextResponse.json({
        success: true,
        data: {
          eylemOnerileri: [],
          eylemYonlendirme: null,
          eylemHastasi: null,
          speech,
          proactiveWarning: null,
          action: null,
          actionResult: null,
          asistanSessionId: asistanSession?.id,
          aktifHasta: cozulenHasta?.ad || null,
          personaId,
          personaName: persona.name,
        },
      })
    }

    // NOTYA-KOTA-01: yazılı sohbet günlük kotaya tabi (dosya gerçeği LLM'e gitmez — kota harcanmaz)
    const kota = await aiKotaKullan(getSupabase(), user.id, 'sohbet')
    if (!kota.izin) return NextResponse.json({ success: false, error: KOTA_MESAJI }, { status: 429 })

    // NOTYA-OGRENME-03: meslektaş hafızası — tek kaynak, tüm yüzeyler aynı bloğu okur
    let hafizaBlogu = ""
    try { hafizaBlogu = hafizaBloguSohbet(await hafizaYukle(getSupabase(), user.id)) } catch { /* hafıza kritik değil */ }
    // NOTYA-GUN-01: oturumun ilk turlarında günün durumu da promptta (açılış baloncuğuyla tutarlı olsun)
    if (messages.length < 2) {
      try {
        const { gunVerisiDerle, gunFazi, gunBlogu } = await import("@/lib/doktor/gunOzeti")
        const gv = await gunVerisiDerle(getSupabase(), user.id)
        hafizaBlogu += `\n\n${gunBlogu(gv, gunFazi(gv.saatTRT))}`
      } catch { /* gün kritik değil */ }
    }

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

    // NOTYA-EYLEM: hasta kimliği SUNUCUDA çözülür. Bu yüzeyde hasta serbest metinden bulunur
    // (hastaninSozunuCoz) — çözülen hasta belirsizse (cozum.tur === 'coklu') aktifEylemHastasi null
    // kalır, araç sunulmaz ve Ayşe hangi hastayı kastettiğini sorar (docs §2: "ambiguous → ask, no card").
    const eylemHastaId = cozulenHasta?.id || (contextPatientId ? String(contextPatientId) : null)
    const eylemHastasi = eylemKapali() ? null : await hastaOzetiGetir(getSupabase(), user.id, eylemHastaId)
    const eylemBransi = bransAnahtari(hekimBransi)
    const araclar = eylemHastasi ? aracTanimlari({ brans: eylemBransi, hasta: eylemHastasi }) : []
    const toolChoice = araclar.length && kayitNiyetiMi(String(message || augmentedMessage || '')) ? ('any' as const) : undefined

    const response = await aiCagir({
      istemci: getAnthropic(),
      gorev: yonlendirme.gorev,
      doctorId: user.id,
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
        { role: "user", content: augmentedMessage }
      ]
    })

    const rawResponse = response.content[0]?.type === "text" ? response.content[0].text : ""

    // KD-DERM-SAFETY-FINDINGS F3: never raw JSON to the doctor — a max_tokens cut is salvaged (speech up to the cut +
    // "yanıt kesildi" note) and a half-written action is dropped.
    const aiData = asistanYanitiCoz(rawResponse, response.stop_reason)
    if (aiData.kesildi) console.warn("[asistan/chat] yanıt kesildi", { stop_reason: response.stop_reason, uzunluk: rawResponse.length })
    // KD-DERM-SAFETY-FINDINGS F4: no internal field names / invented consent form numbers in the bubble
    aiData.speech = doktorMetniTemizle(aiData.speech)
    if (aiData.proactiveWarning) aiData.proactiveWarning = doktorMetniTemizle(aiData.proactiveWarning)

    // KD-DERM-SAFETY-FINDINGS F1 + CROSS-SPECIALTY-PARITY: a dose the doctor did not type (and that is not in the patient
    // file / verified drug context) never reaches the chat bubble — for EVERY branch, not only the prompt-locked chapters.
    const dozKaynak = kaynakSayilari(augmentedMessage, dosyaEk, ...messages.filter((m) => m.role === "user").map((m) => m.content))
    const dozTemiz = uydurmaDozTemizle(String(aiData.speech || ""), dozKaynak)
    if (dozTemiz.dozlar.length) console.warn("[asistan/chat] doz kilidi", { brans: hekimBransi || specialty, dozlar: dozTemiz.dozlar })
    aiData.speech = dozTemiz.metin
    if (aiData.proactiveWarning) aiData.proactiveWarning = uydurmaDozTemizle(String(aiData.proactiveWarning), dozKaynak).metin
    // The prompt-locked chapters also promise "sohbette doz sorulursa sayı verme" — there the hekim is told why a number went.
    if (dozKilitliBrans(hekimBransi, specialty)) {
      if (dozTemiz.dozlar.length) aiData.speech = `${aiData.speech}\n\n⚠ Doz kontrolü (hekim onayı): mesajda/dosyada geçmeyen doz ifadesi yanıttan çıkarıldı; doz hekim tarafından belirlenir.`
    }
    // KD-KAYNAK-KILIDI: a kadın doğum answer never carries a guideline number / year from memory (ACOG PB 797, TJOD 2019 …).
    if (kadinDogumMi(hekimBransi, specialty)) {
      const liste = kdDogrulanmisKaynaklar()
      const r = uydurmaKaynakTemizle(String(aiData.speech || ""), liste)
      if (r.bulgular.length) console.warn("[asistan/chat] kaynak kilidi", r.bulgular)
      aiData.speech = r.bulgular.length ? `${r.metin}\n\n⚠ Kaynak kontrolü (hekim onayı): doğrulanamayan kılavuz numarası / yılı yanıttan çıkarıldı; kaynağı hekim doğrular.` : r.metin
      if (aiData.proactiveWarning) aiData.proactiveWarning = uydurmaKaynakTemizle(String(aiData.proactiveWarning), liste).metin
    }

    // NOTYA-EYLEM: tool_use → taslak öneri + onay kartı. Hiçbir şey yazılmadı; hekim onaylayacak.
    const eylemCtx = (h: NonNullable<typeof eylemHastasi>) => ({ supabase: getSupabase(), doktorId: user.id, hasta: h, brans: eylemBransi, oneriId: "", bugunTRT: bugunTRT() })
    const eylemOnerileri: HazirOneri[] = eylemHastasi
      // NOTYA-EYLEM-21: Ayşe'nin kendi uyarı cümlesi karta "Ayşe'nin notu" olarak taşınır — deterministik
      // kontrolün yerine değil, yanına; asla `ciddi` sayılmaz (core/eylemler/ilacUyari.ts).
      ? await toolUseOnerileri(response as unknown as { content?: unknown }, eylemCtx(eylemHastasi), "sohbet", { brans: eylemBransi, hasta: eylemHastasi }, aiData.proactiveWarning)
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
      actionResult = await executeAction({ type: tip as never, doctorId: user.id, data: veriler, doctorProfile })

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
            yuzey: "sohbet",
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
      } else {
        aiData.speech = `${String(aiData.speech || "").trimEnd()}\n\n${karar.metin}`.trim()
      }
    }

    // Update conversation history
    const updatedMessages = [
      ...messages,
      { role: "user", content: message },
      { role: "assistant", content: aiData.speech }
    ].slice(-SOHBET_SAKLANAN_MESAJ) // ekran + doz-kaynak kontrolü için 20 mesaj saklanır; modele 8'i gider

    await getSupabase().from("asistan_sessions")
      .update({
        messages: updatedMessages,
        ...(cozulenHasta ? {
          patient_id: cozulenHasta.id,
          active_context: {
            ...(asistanSession?.active_context as Record<string, unknown> || {}),
            currentPatientId: cozulenHasta.id,
            patientName: cozulenHasta.ad,
          },
        } : {}),
      })
      .eq("id", asistanSession?.id)

    // Log action for learning
    await getSupabase().from("asistan_actions").insert({
      doctor_id: user.id,
      asistan_session_id: asistanSession?.id,
      action_type: quickIntent || "GENERAL_CHAT",
      input_text: message,
      ai_response: aiData.speech,
      action_data: aiData.action || {}
    })

    // NOTYA-OGRENME-03: ilişki sayacı (seans = farklı gün, mesaj başına değil) + öğrenme.
    // Haiku yalnız doktor kendinden/tercihinden bahsettiğinde çağrılır (regex kapısı — ekonomi).
    try {
      const iliski = await seansIsle(getSupabase(), user.id, "sohbet")
      if (ogrenmeyeDeger(String(message || ""))) {
        await sohbettenOgren(getAnthropic(), getSupabase(), user.id, [
          ...messages.slice(-4).map((m: { role: string; content: string }) => ({ role: m.role, content: m.content })),
          { role: "user", content: String(message) },
          { role: "assistant", content: aiData.speech },
        ])
      }
      if (iliski.seans_sayisi >= 5 && iliski.seans_sayisi - iliski.ozet_seans >= 5) {
        await ozetGerekirseGuncelle(getAnthropic(), getSupabase(), user.id)
      }
    } catch (e) { console.error("[hafiza] sohbet", e) }

    // Miras sayaç (doctor_preferences) — last_session_at
    if (!prefs) {
      await getSupabase().from("doctor_preferences").insert({ doctor_id: user.id, sessions_completed: 1, last_session_at: new Date().toISOString() })
    } else {
      await getSupabase().from("doctor_preferences").update({ last_session_at: new Date().toISOString() }).eq("doctor_id", user.id)
    }

    return NextResponse.json({
      success: true,
      data: {
        eylemOnerileri,
        eylemYonlendirme,
        eylemHastasi: eylemHastasi ? { ad: eylemHastasi.ad, dogumTarihi: eylemHastasi.dogumTarihi } : null,
        speech: aiData.speech,
        proactiveWarning: aiData.proactiveWarning,
        action: aiData.action,
        actionResult,
        asistanSessionId: asistanSession?.id,
        aktifHasta: cozulenHasta?.ad || null,
        personaId,
        personaName: persona.name,
      }
    })

  } catch (error) {
    console.error("[asistan/chat]", error)
    return NextResponse.json({ success: false, error: "Asistan yanıt veremedi" }, { status: 500 })
  }
}
