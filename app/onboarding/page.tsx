
"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://anjayzospuurymjmmtim.supabase.co"
const SUPA_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFuamF5em9zcHV1cnltam1tdGltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NDc5NzIsImV4cCI6MjA5NjIyMzk3Mn0.J4qRde2QJxxErFIWsO6Zb2TPN8GEIFXloLRpdac4GxE"

type AddressingPref = "hocam" | "named_hocam" | "first_name_only"

const TITLES = ["Dr.", "Uzm. Dr.", "Doç. Dr.", "Prof. Dr."] as const
const SPECIALTIES = [
  "dahiliye", "kardiyoloji", "nöroloji", "pediatri", "ortopedi",
  "psikiyatri", "genel_cerrahi", "kadin_hastaliklari", "göz",
  "kulak_burun_bogaz", "dermatoloji", "uroloji", "onkoloji", "acil", "genel",
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [token, setToken] = useState<string | null>(null)
  const [firstNamePreview, setFirstNamePreview] = useState("")

  const [addressingPreference, setAddressingPreference] = useState<AddressingPref>("named_hocam")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [title, setTitle] = useState<string>("Dr.")
  const [specialty, setSpecialty] = useState("genel")
  const [hospital, setHospital] = useState("")
  const [gender, setGender] = useState<"male" | "female">("male")

  useEffect(() => {
    const stored = localStorage.getItem("sb-anjayzospuurymjmmtim-auth-token")
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (parsed.access_token) setToken(parsed.access_token)
      } catch {}
    }
    if (!stored) router.push("/giris")
  }, [router])

  async function saveProfile(completed: boolean) {
    if (!token) { router.push("/giris"); return }
    setLoading(true)
    setError("")
    try {
      const resp = await fetch("/api/users/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          title,
          specialty,
          hospital,
          gender,
          addressing_preference: addressingPreference,
          onboarding_completed: completed,
        }),
      })
      const data = await resp.json()
      if (!data.success) throw new Error(data.error || "Kayıt başarısız")
      if (completed) router.push("/dashboard")
      else setStep(s => s + 1)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Bir hata oluştu")
    } finally {
      setLoading(false)
    }
  }

  const prefOptions: { value: AddressingPref; label: string; desc: string }[] = [
    { value: "hocam", label: "Hocam olarak", desc: '"Hocam, reçeteyi yazdım"' },
    { value: "named_hocam", label: `${firstNamePreview || "Adım"} Hocam olarak`, desc: `"${firstNamePreview || "Gökhan"} Hocam, tanıyı ekledim"` },
    { value: "first_name_only", label: "Sadece adımla", desc: `"${firstNamePreview || "Gökhan"}, not hazır"` },
  ]

  return (
    <div style={{ minHeight: "100vh", background: "#0A1628", display: "flex", alignItems: "center",
                  justifyContent: "center", fontFamily: "system-ui,sans-serif", padding: "20px" }}>
      <div style={{ background: "#fff", borderRadius: "24px", padding: "40px", width: "100%",
                    maxWidth: "480px", boxShadow: "0 24px 80px rgba(0,0,0,.3)" }}>

        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{ fontSize: "26px", fontWeight: "600", color: "#0A1628", marginBottom: "6px" }}>
            <span style={{ color: "#006699" }}>Notya</span> AI
          </div>
          <div style={{ fontSize: "13px", color: "#64748B" }}>
            {step === 0 ? "Adım 1/2 — Hitap tercihi" : "Adım 2/2 — Profil bilgileri"}
          </div>
        </div>

        {error && (
          <div style={{ background: "#FCEBEB", border: "1px solid #F09595", borderRadius: "10px",
                        padding: "12px", fontSize: "13px", color: "#A32D2D", marginBottom: "16px" }}>
            {error}
          </div>
        )}

        {step === 0 && (
          <>
            <div style={{ fontSize: "17px", fontWeight: "600", color: "#0A1628", marginBottom: "8px" }}>
              Merhaba! Ben Notya.
            </div>
            <div style={{ fontSize: "14px", color: "#64748B", marginBottom: "20px", lineHeight: 1.5 }}>
              Size nasıl hitap etmemi istersiniz?
            </div>
            {prefOptions.map(opt => (
              <div key={opt.value}
                onClick={() => setAddressingPreference(opt.value)}
                style={{ border: `2px solid ${addressingPreference === opt.value ? "#006699" : "#E5E7EB"}`,
                         borderRadius: "12px", padding: "14px 16px", marginBottom: "10px", cursor: "pointer",
                         background: addressingPreference === opt.value ? "#F0F9FF" : "#fff" }}>
                <div style={{ fontSize: "14px", fontWeight: "600", color: "#0A1628" }}>{opt.label}</div>
                <div style={{ fontSize: "12px", color: "#64748B", marginTop: "4px" }}>{opt.desc}</div>
              </div>
            ))}
            <button onClick={() => setStep(1)} disabled={loading}
              style={{ width: "100%", padding: "14px", marginTop: "12px", background: "#006699",
                       color: "#fff", border: "none", borderRadius: "12px", fontSize: "15px",
                       fontWeight: "600", cursor: "pointer" }}>
              Devam →
            </button>
          </>
        )}

        {step === 1 && (
          <>
            {[
              { label: "Ad", value: firstName, set: setFirstName, placeholder: "Gökhan", onChange: (v: string) => { setFirstName(v); setFirstNamePreview(v) } },
              { label: "Soyad", value: lastName, set: setLastName, placeholder: "Yılmaz" },
            ].map(f => (
              <div key={f.label} style={{ marginBottom: "14px" }}>
                <label style={{ fontSize: "13px", fontWeight: "500", color: "#374151", display: "block", marginBottom: "6px" }}>
                  {f.label}
                </label>
                <input value={f.value}
                  onChange={e => f.onChange ? f.onChange(e.target.value) : f.set(e.target.value)}
                  placeholder={f.placeholder}
                  style={{ width: "100%", padding: "12px 14px", border: "1.5px solid #E5E7EB", borderRadius: "10px",
                           fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
              </div>
            ))}

            <div style={{ marginBottom: "14px" }}>
              <label style={{ fontSize: "13px", fontWeight: "500", color: "#374151", display: "block", marginBottom: "6px" }}>
                Unvan
              </label>
              <select value={title} onChange={e => setTitle(e.target.value)}
                style={{ width: "100%", padding: "12px 14px", border: "1.5px solid #E5E7EB", borderRadius: "10px", fontSize: "14px" }}>
                {TITLES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: "14px" }}>
              <label style={{ fontSize: "13px", fontWeight: "500", color: "#374151", display: "block", marginBottom: "6px" }}>
                Uzmanlık
              </label>
              <select value={specialty} onChange={e => setSpecialty(e.target.value)}
                style={{ width: "100%", padding: "12px 14px", border: "1.5px solid #E5E7EB", borderRadius: "10px", fontSize: "14px" }}>
                {SPECIALTIES.map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: "14px" }}>
              <label style={{ fontSize: "13px", fontWeight: "500", color: "#374151", display: "block", marginBottom: "6px" }}>
                Hastane / Klinik
              </label>
              <input value={hospital} onChange={e => setHospital(e.target.value)}
                placeholder="Memorial Hastanesi"
                style={{ width: "100%", padding: "12px 14px", border: "1.5px solid #E5E7EB", borderRadius: "10px",
                         fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ fontSize: "13px", fontWeight: "500", color: "#374151", display: "block", marginBottom: "8px" }}>
                Cinsiyet
              </label>
              <div style={{ display: "flex", gap: "10px" }}>
                {(["male", "female"] as const).map(g => (
                  <button key={g} type="button" onClick={() => setGender(g)}
                    style={{ flex: 1, padding: "10px", borderRadius: "10px", cursor: "pointer",
                             border: `2px solid ${gender === g ? "#006699" : "#E5E7EB"}`,
                             background: gender === g ? "#F0F9FF" : "#fff",
                             fontWeight: gender === g ? "600" : "400", fontSize: "13px" }}>
                    {g === "male" ? "Erkek" : "Kadın"}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                if (!firstName.trim()) { setError("Ad gerekli"); return }
                saveProfile(true)
              }}
              disabled={loading || !firstName.trim()}
              style={{ width: "100%", padding: "14px",
                       background: loading || !firstName.trim() ? "#93C5FD" : "#006699",
                       color: "#fff", border: "none", borderRadius: "12px", fontSize: "15px",
                       fontWeight: "600", cursor: loading ? "not-allowed" : "pointer" }}>
              {loading ? "Kaydediliyor..." : "Tamamla →"}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
