'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import KlinikNav from '@/components/klinik/KlinikNav'
import { klinikAraclariHepsi, klinikAraclariListesi, type KlinikArac } from '@/lib/klinik/klinikAraclari'
import { klinikSlugCoz, KLINIK_ETIKET } from '@/lib/specialties/klinikDikey'
import { hekimProfilOturumOku, hekimProfilOturumYaz, hekimProfilTazeleBasligi, hekimProfilTazeleBitti } from '@/lib/doktor/hekimProfilIstemci'

export const dynamic = 'force-dynamic'

export default function KlinikToolsPage() {
  const router = useRouter()
  const [araclar, setAraclar] = useState<KlinikArac[] | null>(null)
  const [etiket, setEtiket] = useState('Klinik')

  useEffect(() => {
    const onbellek = hekimProfilOturumOku()
    const tazele = hekimProfilTazeleBasligi()
    const tipOnbellek = String(onbellek?.profession_type || '')
    if (onbellek?.klinik_erisim) {
      setEtiket('Klinik')
      setAraclar(klinikAraclariHepsi())
    } else if (onbellek && (tipOnbellek === 'klinik-uzman' || tipOnbellek === 'saglik-uzmani')) {
      const slug = klinikSlugCoz(onbellek.specialty)
      setEtiket(slug ? KLINIK_ETIKET[slug] : (onbellek.specialty || 'Klinik'))
      setAraclar(klinikAraclariListesi(onbellek.specialty))
    }
    let iptal = false
    ;(async () => {
      try {
        const raw = localStorage.getItem('auth-token')
        const token = raw ? (JSON.parse(raw).access_token || '') : ''
        if (!token) { router.push('/giris'); return }
        const r = await fetch('/api/users/me', { headers: { Authorization: `Bearer ${token}`, ...tazele } })
        const j = r.ok ? await r.json() : null
        if (r.ok) hekimProfilTazeleBitti()
        const tip = String(j?.data?.profession_type || '')
        const onizleme = Boolean(j?.data?.klinik_erisim)
        if (!onizleme && tip !== 'klinik-uzman' && tip !== 'saglik-uzmani') { router.replace('/dashboard/klinik'); return }
        if (!iptal) {
          // KURAL — TÜRKÇE: profilde slug ('sac-ekimi') saklanır; ekranda Türkçe etiket ('Saç Ekimi').
          if (onizleme) {
            setEtiket('Klinik')
            setAraclar(klinikAraclariHepsi())
          } else {
            const slug = klinikSlugCoz(j?.data?.specialty)
            setEtiket(slug ? KLINIK_ETIKET[slug] : (j?.data?.specialty || 'Klinik'))
            setAraclar(klinikAraclariListesi(j?.data?.specialty))
          }
          hekimProfilOturumYaz({ specialty: j?.data?.specialty, profession_type: j?.data?.profession_type, full_name: j?.data?.full_name, klinik_erisim: onizleme })
        }
      } catch {
        if (!iptal) setAraclar([])
      }
    })()
    return () => { iptal = true }
  }, [router])

  return (
    <div style={{ minHeight: '100vh', background: '#f4eee3', fontFamily: "'Source Sans 3', system-ui, sans-serif" }}>
      <KlinikNav clinicName="Notya Klinik" adminName="" />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 72px' }}>
        <h1 style={{ fontFamily: "'Fraunces', Georgia, serif", margin: '0 0 8px', fontSize: 26, color: '#3b2e24' }}>Klinik Araçlar</h1>
        <p style={{ margin: '0 0 22px', color: '#8b7d70', fontSize: 14 }}>
          {etiket} — Doktor Araçlar’dan ayrı. Yalnız bu klinik dalının araçları.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
          {(araclar || []).map((a) => (
            <button
              key={a.route}
              type="button"
              onClick={() => router.push(a.route)}
              style={{
                textAlign: 'left', background: '#faf6ee', border: '1px solid rgba(58,44,34,0.08)',
                borderRadius: 12, padding: 16, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 8, background: a.circleColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, marginBottom: 10 }}>{a.icon}</div>
              <div style={{ fontWeight: 700, color: '#3b2e24', marginBottom: 6 }}>{a.title}</div>
              <div style={{ fontSize: 12, color: '#8b7d70', lineHeight: 1.4 }}>{a.desc}</div>
            </button>
          ))}
        </div>
        {araclar && araclar.length === 0 && (
          <p style={{ color: '#8b7d70' }}>Bu dal için araç yok. Kayıt adımında Klinik uzmanlık seçin — Doktor branşı burada açılmaz.</p>
        )}
      </div>
    </div>
  )
}
