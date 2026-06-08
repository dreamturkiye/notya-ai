
"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@supabase/supabase-js"

type AddressingPreference = "hocam" | "named_hocam" | "first_name_only"
type DoctorTitle = "Dr." | "Uzm. Dr." | "Doç. Dr." | "Prof. Dr."

const TITLES: DoctorTitle[] = ["Dr.", "Uzm. Dr.", "Doç. Dr.", "Prof. Dr."]

const SPECIALTIES = [
  { value: "dahiliye", label: "Dahiliye" },
  { value: "kardiyoloji", label: "Kardiyoloji" },
  { value: "noroloji", label: "Nöroloji" },
  { value: "pediatri", label: "Pediatri" },
  { value: "ortopedi", label: "Ortopedi" },
  { value: "psikiyatri", label: "Psikiyatri" },
  { value: "genel_cerrahi", label: "Genel Cerrahi" },
  { value: "kadin_hastaliklari", label: "Kadın Hastalıkları" },
  { value: "goz", label: "Göz Hastalıkları" },
  { value: "kulak_burun_bogaz", label: "KBB" },
  { value: "dermatoloji", label: "Dermatoloji" },
  { value: "uroloji", label: "Üroloji" },
  { value: "acil", label: "Acil Tıp" },
  { value: "genel", label: "Pratisyen / Genel" },
]

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [firstNamePreview, setFirstNamePreview] = useState("")

  const [addressingPreference, setAddressingPreference] = useState<AddressingPreference>("named_hocam")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [title, setTitle] = useState<DoctorTitle>("Dr.")
  const [specialty, setSpecialty] = useState("genel")
  const [hospital, setHospital] = useState("")
  const [gender, setGender] = useState<"male" | "female">("male")

  const prefOptions: { value: AddressingPreference; label: string; desc: string }[] = [
    { value: "hocam", label: "Hocam olarak", desc: "Kısa ve saygılı — \"Günaydın hocam\"" },
    {
      value: "named_hocam",
      label: firstNamePreview ? `${firstNamePreview} Hocam olarak` : "Adım + Hocam olarak",
      desc: "Kişisel ve sıcak — \"Gökhan Hocam, bugün 3 hastanız var\"",
    },
    {
      value: "first_name_only",
      label: firstNamePreview ? `Sadece ${firstNamePreview}` : "Sadece adımla",
      desc: "Doğrudan — \"Günaydın Gökhan\"",
    },
  ]

  async function saveProfile() {
    if (!firstName.trim() || !lastName.trim()) {
      setError("Ad ve soyad gerekli")
      return
    }
    setLoading(true)
    setError("")

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/giris")
        return
      }

      const resp = await fetch("/api/users/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          title,
          specialty,
          hospital: hospital.trim() || null,
          gender,
          addressing_preference: addressingPreference,
          onboarding_completed: true,
        }),
      })

      const data = await resp.json()
      if (!resp.ok || !data.success) {
        throw new Error(data.error || "Profil kaydedilemedi")
      }

      router.push("/dashboard")
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Bir hata oluştu")
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    border: "1.5px solid #E5E7EB",
    borderRadius: "10px",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0A1628",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "system-ui,sans-serif",
      padding: "20px",
    }}>
      <div style={{
        background: "#fff",
        borderRadius: "24px",
        padding: "40px",
        width: "100%",
        maxWidth: "480px",
        boxShadow: "0 24px 80px rgba(0,0,0,.3)",
      }}>
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{ fontSize: "26px", fontWeight: "600", color: "#0A1628", marginBottom: "8px" }}>
            <span style={{ color: "#006699" }}>Notya</span> AI
          </div>
          <div style={{ fontSize: "14px", color: "#64748B", lineHeight: 1.5 }}>
            {step === 1
              ? "Merhaba! Ben Notya. Size nasıl hitap etmemi istersiniz?"
              : "Profilinizi tamamlayalım — bir kez soruyoruz."}
          </div>
        </div>

        {error && (
          <div style={{
            background: "#FCEBEB",
            border: "1px solid #F09595",
            borderRadius: "10px",
            padding: "12px",
            fontSize: "13px",
            color: "#A32D2D",
            marginBottom: "16px",
          }}>
            {error}
          </div>
        )}

        {step === 1 && (
          <div>
            {prefOptions.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setAddressingPreference(opt.value)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "14px 16px",
                  marginBottom: "10px",
                  borderRadius: "12px",
                  border: `2px solid ${addressingPreference === opt.value ? "#006699" : "#E5E7EB"}`,
                  background: addressingPreference === opt.value ? "#EFF6FF" : "#fff",
                  cursor: "pointer",
                }}
              >
                <div style={{ fontSize: "14px", fontWeight: "600", color: "#0A1628" }}>{opt.label}</div>
                <div style={{ fontSize: "12px", color: "#64748B", marginTop: "4px" }}>{opt.desc}</div>
              </button>
            ))}
            <button
              type="button"
              onClick={() => setStep(2)}
              style={{
                width: "100%",
                marginTop: "12px",
                padding: "14px",
                background: "#006699",
                color: "#fff",
                border: "none",
                borderRadius: "12px",
                fontSize: "15px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Devam →
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <div style={{ marginBottom: "14px" }}>
              <label style={{ fontSize: "13px", fontWeight: "500", color: "#374151", display: "block", marginBottom: "6px" }}>
                Ad
              </label>
              <input
                type="text"
                value={firstName}
                onChange={e => {
                  setFirstName(e.target.value)
                  setFirstNamePreview(e.target.value.trim())
                }}
                placeholder="Gökhan"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: "14px" }}>
              <label style={{ fontSize: "13px", fontWeight: "500", color: "#374151", display: "block", marginBottom: "6px" }}>
                Soyad
              </label>
              <input
                type="text"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                placeholder="Yılmaz"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: "14px" }}>
              <label style={{ fontSize: "13px", fontWeight: "500", color: "#374151", display: "block", marginBottom: "6px" }}>
                Unvan
              </label>
              <select
                value={title}
                onChange={e => setTitle(e.target.value as DoctorTitle)}
                style={inputStyle}
              >
                {TITLES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: "14px" }}>
              <label style={{ fontSize: "13px", fontWeight: "500", color: "#374151", display: "block", marginBottom: "6px" }}>
                Uzmanlık
              </label>
              <select
                value={specialty}
                onChange={e => setSpecialty(e.target.value)}
                style={inputStyle}
              >
                {SPECIALTIES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: "14px" }}>
              <label style={{ fontSize: "13px", fontWeight: "500", color: "#374151", display: "block", marginBottom: "6px" }}>
                Hastane / Klinik
              </label>
              <input
                type="text"
                value={hospital}
                onChange={e => setHospital(e.target.value)}
                placeholder="Memorial Hastanesi"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ fontSize: "13px", fontWeight: "500", color: "#374151", display: "block", marginBottom: "8px" }}>
                Cinsiyet
              </label>
              <div style={{ display: "flex", gap: "10px" }}>
                {([
                  { value: "male", label: "Erkek" },
                  { value: "female", label: "Kadın" },
                ] as const).map(g => (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => setGender(g.value)}
                    style={{
                      flex: 1,
                      padding: "12px",
                      borderRadius: "10px",
                      border: `2px solid ${gender === g.value ? "#006699" : "#E5E7EB"}`,
                      background: gender === g.value ? "#EFF6FF" : "#fff",
                      cursor: "pointer",
                      fontWeight: gender === g.value ? "600" : "400",
                    }}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{
                  flex: 1,
                  padding: "14px",
                  background: "#F1F5F9",
                  color: "#374151",
                  border: "none",
                  borderRadius: "12px",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                ← Geri
              </button>
              <button
                type="button"
                onClick={saveProfile}
                disabled={loading}
                style={{
                  flex: 2,
                  padding: "14px",
                  background: loading ? "#93C5FD" : "#006699",
                  color: "#fff",
                  border: "none",
                  borderRadius: "12px",
                  fontSize: "15px",
                  fontWeight: "600",
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Kaydediliyor..." : "Başlayalım"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
