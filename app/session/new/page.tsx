"use client"
export const dynamic = "force-dynamic"
import { useState, useRef, useEffect, Suspense } from "react"
import { createClient } from "@supabase/supabase-js"
import { anamnezParcala, fizikParcala } from "@/lib/doktor/anamnezBolumleri"
import { useRouter, useSearchParams } from "next/navigation"
import { BRANS_ETIKETLERI } from "@/lib/intake/bransSorulari"
import { bransAnahtari } from "@/lib/specialties/bransAnahtari"
import { muayeneFormuYolu } from "@/lib/doktor/muayeneFormuYolu"
import { onaylananNotYolu, INCELEME_KUYRUGU_YOLU } from "@/lib/doktor/onaySonrasiYol"
import { seansGeriHref } from "@/lib/doktor/geriNavigasyon"
import MuayeneCekListesi from "@/components/doktor/MuayeneCekListesi"
import {
  cekListeDogrula,
  cekListeSifirla,
  cekListeYaz,
  muayeneCekListesi,
  type CekDogrulamaSatir,
} from "@/lib/doktor/muayeneCekListesi"

// Kaan (2026-09-10): 30 branşın tamamı, kanonik anahtarlarla (BRANS_ETIKETLERI ile aynı) —
// böylece profil branşı hangi branş olursa olsun kilitlenir; eski alt-çizgili anahtarlar eşlenir.
const BRANS_EMOJI: Record<string, string> = { genel: "👨‍⚕️", pediatri: "🧒", kardiyoloji: "❤️", noroloji: "🧠", psikiyatri: "💭", dahiliye: "🩺", ortopedi: "🦴", "kadin-hastaliklari-dogum": "👶", "genel-cerrahi": "🔪", dermatoloji: "🌿", uroloji: "💊", onkoloji: "🎗️", "acil-tip": "🚨", "kulak-burun-bogaz": "👂", "goz-hastaliklari": "👁️", radyoloji: "🩻", anestezi: "😴", "fizik-tedavi": "🏃", "enfeksiyon-hastaliklari": "🦠", endokrinoloji: "🧪", gastroenteroloji: "🫁", nefroloji: "🫘", romatoloji: "🦵", "gogus-hastaliklari": "🫁", "gogus-cerrahisi": "🔬", "plastik-cerrahi": "✂️", "beyin-cerrahisi": "🧠", "kalp-damar-cerrahisi": "❤️‍🩹", "cocuk-cerrahisi": "🧸", "aile-hekimligi": "🏠", "spor-hekimligi": "⚽" }
const SPECIALTIES = [
  { id: "genel", label: "Genel Pratisyen", emoji: BRANS_EMOJI.genel },
  ...(Object.entries(BRANS_ETIKETLERI) as [string, string][]).map(([id, label]) => ({ id, label, emoji: BRANS_EMOJI[id] || "🩺" })),
]

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean; interimResults: boolean; lang: string
  start(): void; stop(): void
  onresult: ((e: SpeechRecognitionEvent) => void) | null
  onerror: ((e: Event) => void) | null
  onend: (() => void) | null
}
interface SpeechRecognitionEvent extends Event {
  results: { length: number; [i: number]: { isFinal: boolean; [j: number]: { transcript: string } } }
}

export default function NewSession() {
  return (
    <Suspense fallback={<div style={{minHeight:"100vh",background:"#0A1628"}} />}>
      <NewSessionInner />
    </Suspense>
  )
}

function NewSessionInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const patientId = searchParams?.get("patientId") || null
  // NOTYA-RANDEVU-TARIH-01 (Kaan/Gökhan, 2026-09-22): randevudan "Muayeneyi Başlat"la gelindiyse
  // randevunun kendi başlangıç saati OTOMATIK olarak muayene tarihi olur — DOKTORA GÖRÜNEN
  // DÜZENLENEBİLİR BİR ALAN DEĞİL (Kaan'ın açık kararı: serbest düzenleme kayıt bütünlüğü
  // riski taşır). Yalnız bilgilendirme amacıyla salt-okunur gösterilir. Randevusuz (walk-in)
  // muayenede bu parametre yok — davranış aynen bugünkü gibi kalır (şimdiki zaman).
  const randevuBaslangicParam = searchParams?.get("randevuBaslangic") || null
  const randevuTarihIso = (() => {
    if (!randevuBaslangicParam) return null
    const t = new Date(randevuBaslangicParam)
    return Number.isNaN(t.getTime()) ? null : t.toISOString()
  })()
  const [specialty, setSpecialty] = useState("genel")
  const [bransKilitli, setBransKilitli] = useState(false)

  // NOTYA-BRANS-02: branş onboarding'de alınıyor — her muayenede TEKRAR SORULMAZ.
  // Profilde branş varsa otomatik seçilir ve seçici gizlenir; yoksa seçici yedeğe düşer.
  useEffect(() => {
    (async () => {
      // Kaan/Gökhan (2026-09-10): "Muayeneyi Başlat"tan sonra seçici yine çıktı, Pediatri seçilmedi.
      // Sebep: bu sayfa süresi dolmuş token'la /api/users/me'ye gidiyordu (401 → seçici). Şimdi
      // (1) yenilenen token ile sorulur, (2) sonuç önbelleğe alınır, (3) ağ/oturum hatasında önbellek kullanılır.
      const uygula = (bHam: string | null | undefined) => {
        // Eski anahtarlar ('kadin-dogum', 'kadin_hastaliklari', 'genel_cerrahi', 'acil') tek çözücüden kanonik anahtara; 'genel' olduğu gibi kalır.
        const b = bHam ? (bransAnahtari(bHam) ?? bHam) : bHam
        if (b && SPECIALTIES.some((s) => s.id === b)) { setSpecialty(b); setBransKilitli(true); return true }
        return false
      }
      try {
        const onbellek = localStorage.getItem('notya_doktor_specialty')
        if (onbellek) uygula(onbellek)
      } catch { /* önbellek yok */ }
      try {
        const { ensureDoctorAccessToken } = await import('@/lib/doktor/clientAuth')
        const token = await ensureDoctorAccessToken()
        if (!token) return
        const r = await fetch("/api/users/me", { headers: { Authorization: `Bearer ${token}` } })
        if (!r.ok) return
        const d = await r.json()
        const b = d?.data?.specialty || d?.specialty
        if (uygula(b)) { try { localStorage.setItem('notya_doktor_specialty', String(b)) } catch { /* yok */ } }
      } catch { /* sessiz — önbellek ya da seçici */ }
    })()
  }, [])

  // Yeni muayene: önceki vizitin işaretleri durmasın. Doğum tarihi → yaşa özel sağlam çocuk maddeleri.
  useEffect(() => {
    cekListeSifirla(patientId)
    setCekIsaret({})
    if (!patientId) { setHastaDogumIso(null); return }
    let iptal = false
    ;(async () => {
      try {
        const { ensureDoctorAccessToken } = await import('@/lib/doktor/clientAuth')
        const token = await ensureDoctorAccessToken()
        if (!token || iptal) return
        const r = await fetch(`/api/doktor/hastalar/${patientId}`, { headers: { Authorization: `Bearer ${token}` } })
        if (!r.ok || iptal) return
        const d = await r.json()
        const dob = d?.patient?.dogum_tarihi || d?.dogum_tarihi
        if (dob && !iptal) setHastaDogumIso(String(dob).slice(0, 10))
      } catch { /* liste generic pediatri maddeleriyle açılır */ }
    })()
    return () => { iptal = true }
  }, [patientId])
  const [sessionType, setSessionType] = useState("muayene")
  const [step, setStep] = useState<"setup"|"recording"|"processing"|"done">("setup")
  // NOTYA-GECMIS-MUAYENE-01 (Kaan/Gökhan, 2026-09-22): test/geçmiş veri girişi için opsiyonel
  // geçmiş tarih. Boş bırakılırsa hiçbir şey değişmez (varsayılan: şimdi). Sadece GEÇMİŞ tarih
  // kabul edilir; gelecek tarih sunucuda yok sayılır (aşağıdaki API'ler).
  const [gecmisTarih, setGecmisTarih] = useState("")
  // Manuel test alanı (geçici) doktorun kendi seçimi olduğu için öncelikli; aksi halde
  // randevudan gelen otomatik, düzenlenemeyen değer kullanılır; ikisi de yoksa şimdi.
  const efektifTarihIso = gecmisTarih ? new Date(gecmisTarih).toISOString() : randevuTarihIso
  const [seconds, setSeconds] = useState(0)
  const [transcript, setTranscript] = useState("")
  const [isRecordingVoice, setIsRecordingVoice] = useState(false)
  const [note, setNote] = useState<Record<string,unknown>|null>(null)
  const [onayDurumu, setOnayDurumu] = useState<"beklemede"|"gonderiliyor"|"onaylandi">("beklemede")
  const [onayHata, setOnayHata] = useState("")
  const [sesYukleniyor, setSesYukleniyor] = useState(false)
  const [sesHata, setSesHata] = useState("")
  const [error, setError] = useState("")
  const [cekIsaret, setCekIsaret] = useState<Record<string, boolean>>({})
  const [cekDogrulama, setCekDogrulama] = useState<CekDogrulamaSatir[] | null>(null)
  const [hastaDogumIso, setHastaDogumIso] = useState<string | null>(null)
  const cekGirdi = { seansBransi: specialty, hastaDogumIso }
  const timerRef = useRef<ReturnType<typeof setInterval>|null>(null)
  const recognitionRef = useRef<SpeechRecognitionInstance|null>(null)
  const transcriptRef = useRef("")  // Keep ref in sync for speech callbacks

  // NOTYA-SES-01: hazır ses dosyasını doğrudan Storage'a yükle (Vercel gövde limiti aşılır),
  // sunucu transkript + SOAP üretir, not İnceleme kuyruğuna düşer. Ham ses sunucuda silinir.
  async function sesDosyasiIsle(dosya: File) {
    setSesHata("")
    if (dosya.size > 60 * 1024 * 1024) { setSesHata("Dosya 60 MB'ı aşıyor. Daha kısa bir kayıt deneyin."); return }
    setSesYukleniyor(true)
    try {
      const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      const { data: { session: authSession } } = await sb.auth.getSession()
      const authToken = authSession?.access_token
      const userId = authSession?.user?.id
      if (!authToken || !userId) throw new Error("Oturum bulunamadı. Yeniden giriş yapın.")
      const guvenliAd = dosya.name.replace(/[^a-zA-Z0-9_.-]/g, "_").slice(-60) || "kayit"
      const yol = `${userId}/${Date.now()}-${guvenliAd}`
      const { error: yuklemeHatasi } = await sb.storage.from("ses-kayitlari").upload(yol, dosya, { contentType: dosya.type || "audio/mpeg" })
      if (yuklemeHatasi) throw new Error("Yükleme başarısız: " + yuklemeHatasi.message)
      const resp = await fetch("/api/sessions/ses-yukle", {
        method: "POST",
        headers: { "Authorization": `Bearer ${authToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ path: yol, patientId: patientId || null, specialty, ...(efektifTarihIso ? { tarih: efektifTarihIso } : {}) }),
      })
      const d = await resp.json()
      if (!resp.ok) throw new Error(d.error || "Not üretilemedi.")
      router.push(d.noteId ? muayeneFormuYolu(String(d.noteId)) : INCELEME_KUYRUGU_YOLU)  // NOTYA-NOT-DUZENLE-01: ses dosyası da doğrudan düzenlenebilir forma
    } catch (e) {
      setSesHata(e instanceof Error ? e.message : "Yükleme başarısız oldu.")
    } finally {
      setSesYukleniyor(false)
    }
  }
  const getSB = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  // Keep ref in sync with state
  useEffect(() => { transcriptRef.current = transcript }, [transcript])

  function startTimer() {
    // Duraklat/devam doğru toplansın diye sayaç burada SIFIRLANMAZ; sıfırlama seans girişinde.
    if (timerRef.current) return
    timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000)
  }

  function stopTimer() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }

  function toggleVoice() {
    if (isRecordingVoice) {
      recognitionRef.current?.stop()
      setIsRecordingVoice(false)
      return
    }
    const w = window as unknown as { SpeechRecognition?: new () => SpeechRecognitionInstance; webkitSpeechRecognition?: new () => SpeechRecognitionInstance }
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition
    if (!SR) { setError("Tarayıcınız ses tanımayı desteklemiyor. Chrome veya Safari kullanın."); return }

    const r = new SR()
    r.continuous = true
    r.interimResults = false
    r.lang = "tr-TR"

    r.onresult = (e: SpeechRecognitionEvent) => {
      let newText = ""
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) newText += e.results[i][0].transcript + " "
      }
      if (newText.trim()) {
        // Append to existing transcript
        const updated = (transcriptRef.current + " " + newText).trim()
        transcriptRef.current = updated
        setTranscript(updated)
      }
    }

    r.onerror = () => { setIsRecordingVoice(false); stopTimer() }
    r.onend = () => { setIsRecordingVoice(false); stopTimer() }

    recognitionRef.current = r
    r.start()
    setIsRecordingVoice(true)
    // NOTYA-KAYIT-01 (canlı defter): sayaç ve "devam ediyor" ancak gerçek kayıtla başlar.
    startTimer()
  }

  async function processSession() {
    stopTimer()
    if (!transcript.trim()) {
      setError("Lütfen önce muayene notlarını yazın veya sesle kaydedin.")
      return
    }
    setStep("processing")
    setError("")

    try {
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/giris"); return }

      const { data: session, error: se } = await supabase.from("sessions").insert({
        doctor_id: user.id, patient_id: patientId, specialty, session_type: sessionType,
        status: "processing", duration_seconds: seconds,
        patient_consent_given: true, patient_consent_at: new Date().toISOString(),
        ...(efektifTarihIso ? { started_at: efektifTarihIso } : {}),
      }).select().single()
      if (se || !session) throw new Error("Seans oluşturulamadı: " + se?.message)

      const { data: { session: authSession } } = await (async () => { const raw = localStorage.getItem(Object.keys(localStorage).find(k=>k.includes('auth-token'))||''); return raw ? { data: { session: JSON.parse(raw) } } : { data: { session: null } } })()
      const authToken = authSession?.access_token
      if (!authToken) throw new Error("Oturum bulunamadı")

      const resp = await fetch(`/api/sessions/${session.id}/end`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${authToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          segments: [{ speaker: "doktor", text: transcript, start_ms: 0, end_ms: seconds*1000, confidence: 0.9 }],
          transcript, duration_seconds: seconds, profession: "doktor",
          context: { specialty, session_type: sessionType },
          cekListe: cekIsaret,
          ...(efektifTarihIso ? { tarih: efektifTarihIso } : {}),
        })
      })

      // AUDIT-2026-09-03: 504/Vercel çökmesi düz metin döner — resp.json() ham hatayı gösteriyordu.
      const hamMetin = await resp.text()
      let result: { success?: boolean; error?: string; data?: { note: Record<string, unknown> } }
      try { result = JSON.parse(hamMetin) } catch {
        throw new Error("Sunucu geçici bir sorun yaşadı. Notlarınız güvende — birkaç saniye bekleyip 'Seansı Bitir'e yeniden basın.")
      }
      if (!resp.ok || !result.success) throw new Error(result.error || "Not oluşturulamadı")
      const not = (result.data as { note: Record<string, unknown>; cekListeDogrulama?: CekDogrulamaSatir[] }).note
      setNote(not)
      const dog = (result.data as { cekListeDogrulama?: CekDogrulamaSatir[] }).cekListeDogrulama
      if (dog) setCekDogrulama(dog)
      else {
        const maddeler = muayeneCekListesi(cekGirdi)
        setCekDogrulama(cekListeDogrula(maddeler, { transcript, soap: JSON.stringify(not), isaretler: cekIsaret }))
      }
      // NOTYA-NOT-DUZENLE-01 (Gökhan, 2026-09-23): "Notu oluştur"dan sonra salt-okunur "Not Hazır"
      // ara ekranı çıkıyordu; hekim doğrudan düzenlenebilir muayene formuna gitmeli. Önceki düzeltme
      // yalnız "Not Revizyonu" butonunun hedefini değiştirmişti, ara ekran kalmıştı. Çek-liste
      // doğrulaması ai_degerlendirme'ye yazıldığı için formda kaybolmaz. Kimlik yoksa eski ekran yedek.
      if (not?.id) { router.replace(muayeneFormuYolu(String(not.id))); return }
      setStep("done")
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Bir hata oluştu")
      setStep("recording")
    }
  }

  function fmt(s: number) { return `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}` }

  async function notuOnayla() {
    const noteId = note?.id ? String(note.id) : ""
    if (!noteId) { setOnayHata("Not kimliği bulunamadı — Not Revizyonu'ndan onaylayabilirsiniz."); return }
    setOnayDurumu("gonderiliyor"); setOnayHata("")
    try {
      const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      const { data: { session: authSession } } = await sb.auth.getSession()
      const authToken = authSession?.access_token
      if (!authToken) throw new Error("Oturum bulunamadı")
      const r = await fetch(`/api/notes/${noteId}/approve`, { method: "POST", headers: { Authorization: `Bearer ${authToken}` } })
      const d = await r.json().catch(() => ({}))
      if (!r.ok || d.success === false) throw new Error(d.error || "Onaylanamadı")
      setOnayDurumu("onaylandi")
      // NOTYA-ONAY-DONUS-01 (Gökhan): onaydan sonra genel panoya değil, notun kesinleşmiş
      // haline — hasta dosyasından açıldığında görülen sayfanın ta kendisine. Oradan
      // "✏️ Yeniden Düzenle" ile düzeltip yeniden onaylayabilir.
      setTimeout(() => router.push(onaylananNotYolu(noteId)), 900)
    } catch (e: unknown) {
      setOnayDurumu("beklemede")
      setOnayHata(e instanceof Error ? e.message : "Onaylanamadı — Not Revizyonu'ndan deneyin.")
    }
  }

  const S = (s: Record<string,unknown>) => s as React.CSSProperties

  return (
    <div className="notya-seans-sayfa" style={S({minHeight:"100vh",background:"#0A1628",fontFamily:"system-ui,sans-serif",padding:"20px"})}>
      <div style={S({maxWidth: step === "recording" || step === "done" ? "980px" : "600px", margin:"0 auto"})}>
        <div style={S({display:"flex",alignItems:"center",gap:"12px",marginBottom:"24px"})}>
          <div onClick={()=>router.push(seansGeriHref(patientId))} style={S({color:"rgba(255,255,255,.6)",cursor:"pointer",fontSize:"14px"})}>← Geri</div>
          <div style={S({fontSize:"18px",fontWeight:"600",color:"#fff"})}>Yeni Seans</div>
        </div>

        {error && <div style={S({background:"#FCEBEB",border:"1px solid #F09595",borderRadius:"12px",padding:"14px",fontSize:"13px",color:"#A32D2D",marginBottom:"16px"})}>{error}</div>}

        {step === "setup" && (
          <div style={S({background:"#fff",borderRadius:"20px",padding:"24px"})}>
            {bransKilitli ? (
              <div style={S({display:"flex",alignItems:"center",gap:"8px",marginBottom:"20px",padding:"10px 12px",background:"#F0FDFA",border:"1px solid #99F6E4",borderRadius:"10px",fontSize:"13px",color:"#0F766E",fontWeight:"600"})}>
                <span>{SPECIALTIES.find(s=>s.id===specialty)?.emoji}</span>
                <span>Branş: {SPECIALTIES.find(s=>s.id===specialty)?.label}</span>
                <span style={S({fontWeight:"400",color:"#64748B"})}>· profilinizden</span>
              </div>
            ) : (<>
            <div style={S({fontSize:"15px",fontWeight:"600",color:"#0A1628",marginBottom:"16px"})}>Uzmanlık Seçin</div>
            <div style={S({display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"20px"})}>
              {SPECIALTIES.map(s => (
                <div key={s.id} onClick={()=>setSpecialty(s.id)}
                  style={S({padding:"10px 12px",borderRadius:"10px",border:`1.5px solid ${specialty===s.id?"#2563EB":"#E5E7EB"}`,background:specialty===s.id?"#EFF6FF":"#fff",cursor:"pointer",display:"flex",alignItems:"center",gap:"8px",fontSize:"13px",fontWeight:specialty===s.id?"600":"400",color:specialty===s.id?"#1D4ED8":"#374151"})}>
                  <span>{s.emoji}</span>{s.label}
                </div>
              ))}
            </div>
            </>)}
            <div style={S({fontSize:"15px",fontWeight:"600",color:"#0A1628",marginBottom:"12px"})}>Seans Türü</div>
            <div style={S({display:"flex",gap:"8px",marginBottom:"20px"})}>
              {["muayene","kontrol","konsültasyon"].map(t=>(
                <div key={t} onClick={()=>setSessionType(t)}
                  style={S({padding:"8px 16px",borderRadius:"20px",border:`1.5px solid ${sessionType===t?"#2563EB":"#E5E7EB"}`,background:sessionType===t?"#EFF6FF":"#fff",cursor:"pointer",fontSize:"13px",fontWeight:sessionType===t?"600":"400",color:sessionType===t?"#1D4ED8":"#374151"})}>
                  {t}
                </div>
              ))}
            </div>
            <button onClick={()=>{cekListeSifirla(patientId);setCekIsaret({});setSeconds(0);setStep("recording")}}
              style={S({width:"100%",padding:"16px",background:"#2563EB",color:"#fff",border:"none",borderRadius:"12px",fontSize:"16px",fontWeight:"600",cursor:"pointer"})}>
              🎙️ Seansa Başla
            </button>
            {/* NOTYA-RANDEVU-TARIH-01: randevudan gelindiyse otomatik tarih — SALT-OKUNUR, düzenlenemez. */}
            {randevuTarihIso && !gecmisTarih && (
              <div style={S({marginTop:"14px",padding:"10px 12px",background:"#ECFDF5",border:"1px solid #6EE7B7",borderRadius:"10px",fontSize:"12px",color:"#065F46"})}>
                📅 Bu muayene randevu saatiyle kaydedilecek: <strong>{new Date(randevuTarihIso).toLocaleString("tr-TR", { dateStyle: "long", timeStyle: "short" })}</strong>
              </div>
            )}
            {/* NOTYA-GECMIS-MUAYENE-01: geçmiş veri girişi/test için opsiyonel geçmiş tarih — boş
                bırakılırsa hiçbir şey değişmez, not her zamanki gibi şimdiki tarihle kaydedilir. */}
            <div style={S({marginTop:"14px",padding:"10px 12px",background:"#F9FAFB",border:"1px dashed #D1D5DB",borderRadius:"10px"})}>
              <label style={S({display:"block",fontSize:"12px",fontWeight:"600",color:"#374151",marginBottom:"6px"})}>
                📅 Geçmişe dönük tarih <span style={S({fontWeight:"400",color:"#94A3B8"})}>(opsiyonel — geçmiş kayıt girişi için)</span>
              </label>
              <input type="datetime-local" value={gecmisTarih} max={new Date(Date.now() - 60000).toISOString().slice(0,16)}
                onChange={e=>setGecmisTarih(e.target.value)}
                style={S({width:"100%",padding:"8px 10px",border:"1.5px solid #E5E7EB",borderRadius:"8px",fontSize:"13px",color:"#374151",boxSizing:"border-box"})} />
              {gecmisTarih && (
                <div style={S({fontSize:"11px",color:"#0F9B8E",marginTop:"6px"})}>
                  Bu muayene {new Date(gecmisTarih).toLocaleDateString("tr-TR")} tarihiyle kaydedilecek — 
                  <span onClick={()=>setGecmisTarih("")} style={S({textDecoration:"underline",cursor:"pointer",marginLeft:"4px"})}>temizle</span>
                </div>
              )}
            </div>
            {/* NOTYA-SES-01: hazır ses kaydı yükle — telefonda kaydedilen ya da kayıt başlatılmayı
                unutulan muayeneler için aynı Ayşe Kaya SOAP motoru. Ses, transkript sonrası silinir. */}
            <div style={S({textAlign:"center",margin:"14px 0 6px",color:"#9CA3AF",fontSize:"12px"})}>ya da</div>
            <label style={S({display:"block",width:"100%",padding:"13px",background:sesYukleniyor?"#EFF6FF":"#F9FAFB",color:"#374151",border:"1.5px dashed #D1D5DB",borderRadius:"12px",fontSize:"14px",fontWeight:"600",cursor:sesYukleniyor?"default":"pointer",textAlign:"center",boxSizing:"border-box"})}>
              {sesYukleniyor ? "⏳ Ses çözümlüyor ve not üretiliyor… birkaç dakika sürebilir, sayfayı kapatmayın" : "📁 Ses dosyası yükle (m4a / mp3 / wav)"}
              <input type="file" accept="audio/*,.m4a,.mp3,.wav,.aac,.ogg" style={{display:"none"}} disabled={sesYukleniyor}
                onChange={(e)=>{const f=e.target.files?.[0]; if(f) sesDosyasiIsle(f); e.target.value=""}} />
            </label>
            {sesHata && <div style={S({marginTop:"8px",color:"#DC2626",fontSize:"13px"})}>{sesHata}</div>}
          </div>
        )}

        {step === "recording" && (
          <div className="notya-grid-yigin notya-seans-cek" style={S({display:"grid",gridTemplateColumns:"minmax(0,1.15fr) minmax(240px,0.85fr)",gap:"16px",alignItems:"start"})}>
          <div className="notya-seans-kayit" style={S({background:"#fff",borderRadius:"20px",padding:"24px"})}>
            <div style={S({textAlign:"center",marginBottom:"20px"})}>
              <div style={S({width:"64px",height:"64px",background:isRecordingVoice?"#FEE2E2":"#EFF6FF",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px",fontSize:"28px"})}>🎙️</div>
              <div style={S({fontSize:"32px",fontWeight:"600",color:"#0A1628",fontFamily:"monospace",marginBottom:"4px"})}>{fmt(seconds)}</div>
              <div style={S({fontSize:"13px",color:"#64748B",lineHeight:1.45,padding:"0 4px"})}>{isRecordingVoice ? "Kayıt devam ediyor" : seconds > 0 ? "Kayıt duraklatıldı" : "Kayıt başlamadı — 🎤 Sesle Dikte Et'e basın"} · {SPECIALTIES.find(s=>s.id===specialty)?.label}</div>
            </div>

            {/* Voice recording button */}
            <div style={S({display:"flex",alignItems:"center",justifyContent:"center",gap:"10px",marginBottom:"14px"})}>
              <button onClick={toggleVoice}
                style={S({padding:"10px 20px",background:isRecordingVoice?"#DC2626":"#2563EB",color:"#fff",border:"none",borderRadius:"20px",fontSize:"13px",fontWeight:"600",cursor:"pointer",display:"flex",alignItems:"center",gap:"6px"})}>
                {isRecordingVoice ? "⏹ Sesi Durdur" : "🎤 Sesle Dikte Et"}
              </button>
              {isRecordingVoice && <span style={S({fontSize:"12px",color:"#DC2626",animation:"pulse 1s infinite"})}>● Dinliyor...</span>}
            </div>

            <div style={S({fontSize:"13px",fontWeight:"500",color:"#374151",marginBottom:"8px"})}>
              Seans notları <span style={S({color:"#DC2626"})}>*</span>
              <span style={S({fontSize:"11px",color:"#94A3B8",marginLeft:"8px",fontWeight:"400"})}>Sesle veya yazarak girin</span>
            </div>
            <textarea value={transcript} onChange={e=>setTranscript(e.target.value)}
              placeholder={"Muayene bulgularını buraya yazın...\n\nÖrnek: 7 yaşında erkek hasta, 3 gündür devam eden ateş şikayeti var. Ateş 38.8°C. Boğaz kırmızı, tonsiller hiperemik..."}
              style={S({width:"100%",minHeight:"180px",padding:"12px",border:"1.5px solid #E5E7EB",borderRadius:"10px",fontSize:"16px",fontFamily:"system-ui",resize:"vertical",marginBottom:"16px",color:"#374151",lineHeight:"1.6",outline:"none",boxSizing:"border-box"})}
            />
            <div className="notya-seans-aksiyon" style={S({display:"flex",gap:"10px"})}>
              <button onClick={()=>{stopTimer();recognitionRef.current?.stop();setStep("setup");setSeconds(0);setTranscript("")}}
                style={S({flex:1,padding:"14px",background:"#F1F5F9",color:"#374151",border:"none",borderRadius:"10px",fontSize:"14px",cursor:"pointer"})}>
                İptal
              </button>
              <button onClick={processSession}
                style={S({flex:2,padding:"14px",background:transcript.trim()?"#DC2626":"#94A3B8",color:"#fff",border:"none",borderRadius:"10px",fontSize:"15px",fontWeight:"600",cursor:transcript.trim()?"pointer":"not-allowed"})}>
                ⏹ Seansı Bitir → Not Oluştur
              </button>
            </div>
            <div style={S({textAlign:"center",marginTop:"10px",fontSize:"11px",color:"#94A3B8"})}>
              Notları yazdıktan sonra "Seansı Bitir" butonuna basın
            </div>
          </div>
          <MuayeneCekListesi
            acikRenk
            maddeler={muayeneCekListesi(cekGirdi)}
            isaretler={cekIsaret}
            onToggle={(id) => {
              const sonraki = { ...cekIsaret, [id]: !cekIsaret[id] }
              setCekIsaret(sonraki)
              cekListeYaz(patientId, sonraki)
            }}
          />
          </div>
        )}

        {step === "processing" && (
          <div style={S({background:"#fff",borderRadius:"20px",padding:"48px",textAlign:"center"})}>
            <div style={S({fontSize:"48px",marginBottom:"16px"})}>⚙️</div>
            <div style={S({fontSize:"18px",fontWeight:"600",color:"#0A1628",marginBottom:"8px"})}>AI Not Oluşturuyor</div>
            <div style={S({fontSize:"13px",color:"#94A3B8"})}>30-60 saniye...</div>
          </div>
        )}

        {step === "done" && note && (
          <div style={S({background:"#fff",borderRadius:"20px",padding:"24px"})}>
            <div style={S({display:"flex",alignItems:"center",gap:"10px",marginBottom:"20px",paddingBottom:"16px",borderBottom:"1px solid #E5E7EB"})}>
              <div style={S({fontSize:"24px"})}>✅</div>
              <div>
                <div style={S({fontSize:"16px",fontWeight:"600",color:"#0A1628"})}>Not Hazır</div>
                <div style={S({fontSize:"12px",color:"#64748B"})}>AI güveni: {Math.round(((note.ai_confidence as number)||0.9)*100)}%</div>
              </div>
            </div>
            {/* NOTYA-BASLIK-01: Anamnez bölümleri kendi başlıklarıyla (Şikayet, Şikayetin Hikayesi, Özgeçmiş...) */}
            {anamnezParcala(String((note as Record<string, unknown>).content_subjektif || '')).map((b, bi) => (
              <div key={'anm' + bi} style={S({marginBottom:"14px"})}>
                <div style={S({fontSize:"10px",fontWeight:"600",color:"#2563EB",textTransform:"uppercase",letterSpacing:".5px",marginBottom:"5px"})}>{b.baslik}</div>
                <div style={S({fontSize:"13px",color:"#374151",lineHeight:"1.6",whiteSpace:"pre-wrap",background:"#F8FAFC",borderRadius:"10px",padding:"12px"})}>{b.metin}</div>
              </div>
            ))}
            {fizikParcala(String((note as Record<string, unknown>).content_objektif || '')).map((b, bi) => (
              <div key={'fm' + bi} style={S({marginBottom:"14px"})}>
                <div style={S({fontSize:"10px",fontWeight:"600",color:"#059669",textTransform:"uppercase",letterSpacing:".5px",marginBottom:"5px"})}>{b.baslik}</div>
                <div style={S({fontSize:"13px",color:"#374151",lineHeight:"1.6",whiteSpace:"pre-wrap",background:"#F8FAFC",borderRadius:"10px",padding:"12px"})}>{b.metin}</div>
              </div>
            ))}
            {([
              {label:"Tanı",key:"content_degerlendirme",color:"#D97706"},
              {label:"Tedavi",key:"content_plan",color:"#7C3AED"},
            ] as {label:string;key:string;color:string}[]).filter(s=>(note as Record<string,unknown>)[s.key]).map(section=>(
              <div key={section.key} style={S({marginBottom:"14px"})}>
                <div style={S({fontSize:"10px",fontWeight:"600",color:section.color,textTransform:"uppercase",letterSpacing:".5px",marginBottom:"5px"})}>{section.label}</div>
                <div style={S({fontSize:"13px",color:"#374151",background:"#F8FAFC",borderRadius:"8px",padding:"10px 12px",lineHeight:"1.6"})}>{String((note as Record<string,unknown>)[section.key])}</div>
              </div>
            ))}
            {Array.isArray(note.kritik_bulgular) && (note.kritik_bulgular as string[]).length > 0 && (
              <div style={S({background:"#FEF9E7",borderRadius:"10px",padding:"12px",marginBottom:"14px",border:"1px solid #F5D97E"})}>
                <div style={S({fontSize:"12px",fontWeight:"600",color:"#92700A",marginBottom:"4px"})}>💡 Dikkate almayı düşünür müsünüz?</div>
                {(note.kritik_bulgular as string[]).map((b,i)=><div key={i} style={S({fontSize:"12px",color:"#6B5306"})}>• {b}</div>)}
              </div>
            )}
            {!!note.takip_suresi && (
              <div style={S({fontSize:"13px",color:"#374151",background:"#EFF6FF",borderRadius:"8px",padding:"10px 12px",marginBottom:"14px"})}>
                📅 <strong>Takip:</strong> {String(note.takip_suresi)}
              </div>
            )}
            <div style={S({display:"flex",gap:"10px",marginTop:"8px"})}>
              {/* NOTYA-ONAY-DONUS-01: "Not Revizyonu" genel kuyruğa atıyordu — notu orada aramak
                  gerekiyordu. Not kimliği varsa doğrudan O notun muayene formuna gider. */}
              <button onClick={()=>router.push(note?.id ? muayeneFormuYolu(String(note.id)) : INCELEME_KUYRUGU_YOLU)}
                style={S({flex:1,padding:"14px",background:"#F1F5F9",color:"#374151",border:"none",borderRadius:"10px",fontSize:"14px",fontWeight:"600",cursor:"pointer"})}>
                Not Revizyonu
              </button>
              <button onClick={notuOnayla} disabled={onayDurumu==="gonderiliyor"}
                style={S({flex:1,padding:"14px",background:onayDurumu==="onaylandi"?"#16A34A":"#0F9B8E",color:"#fff",border:"none",borderRadius:"10px",fontSize:"14px",fontWeight:"600",cursor:onayDurumu==="gonderiliyor"?"default":"pointer",opacity:onayDurumu==="gonderiliyor"?0.7:1})}>
                {onayDurumu==="gonderiliyor"?"Onaylanıyor…":onayDurumu==="onaylandi"?"✓ Onaylandı":"Notu Onayla"}
              </button>
            </div>
            {onayHata && <div style={S({marginTop:"8px",color:"#DC2626",fontSize:"13px",textAlign:"center"})}>{onayHata}</div>}
            {cekDogrulama && (
              <div style={S({marginTop:"16px"})}>
                <MuayeneCekListesi
                  acikRenk
                  maddeler={muayeneCekListesi(cekGirdi)}
                  isaretler={cekIsaret}
                  dogrulama={cekDogrulama}
                  onToggle={() => { /* not üretildikten sonra kilit */ }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
