'use client'
/**
 * Klinik seans — Doktor SOAP kopyası değil. Yerel elektronik kayıt (md.18 / md.24).
 */
import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import KlinikNav from '@/components/klinik/KlinikNav'
import { MUTTEFIK_TANI_KILIT, KLINIK_HEKIM_KILIT, klinikSlugCoz, muttefikMeslekMi, type KlinikYeniSlug } from '@/lib/specialties/klinikDikey'
import { KLINIK_ORTAK_KAYIT } from '@/lib/klinik/klinikMevzuat'
import { seansEkle, type KlinikSeansKayit } from '@/lib/klinik/klinikKayit'
import { klinikDefterOku, klinikDefterYaz } from '@/lib/klinik/klinikKayitIstemci'

export const dynamic = 'force-dynamic'

function token(): string {
  try {
    const raw = localStorage.getItem('auth-token')
    return raw ? (JSON.parse(raw).access_token || '') : ''
  } catch { return '' }
}

function SeansIc() {
  const sp = useSearchParams()
  const router = useRouter()
  const patientId = sp?.get('patientId') || ''
  const [userId, setUserId] = useState('')
  const [dal, setDal] = useState<KlinikYeniSlug | null>(null)
  const [not, setNot] = useState('')
  const [kayit, setKayit] = useState('')
  const [riza, setRiza] = useState(false)
  const [veli, setVeli] = useState(false)
  const [kucuk, setKucuk] = useState(false)
  const [foto, setFoto] = useState(false)
  const [plan, setPlan] = useState(false)
  const [kriz, setKriz] = useState(false)
  const [onceki, setOnceki] = useState<KlinikSeansKayit[]>([])

  useEffect(() => {
    let iptal = false
    ;(async () => {
      const t = token()
      if (!t) { router.push('/giris'); return }
      const [me, p] = await Promise.all([
        fetch('/api/users/me', { headers: { Authorization: `Bearer ${t}` } }),
        patientId ? fetch(`/api/doktor/hastalar/${patientId}`, { headers: { Authorization: `Bearer ${t}` } }) : Promise.resolve(null),
      ])
      const mj = me.ok ? await me.json() : null
      const uid = String(mj?.data?.id || mj?.data?.user_id || '')
      const d = klinikSlugCoz(mj?.data?.specialty)
      const dogum = p && p.ok ? (await p.json())?.patient?.dogum_tarihi || '' : ''
      const yas = dogum ? Math.floor((Date.now() - Date.parse(String(dogum).slice(0, 10))) / 31557600000) : null
      if (!iptal) {
        setUserId(uid)
        setDal(d)
        setKucuk(yas !== null && yas < 18)
        if (uid && patientId) setOnceki(klinikDefterOku(uid)[patientId]?.seanslar || [])
      }
    })()
    return () => { iptal = true }
  }, [patientId, router])

  const muttefik = muttefikMeslekMi(dal)

  function kaydet() {
    if (!patientId) { setKayit('Hasta dosyasından seans açın — kayıt hastaya bağlanır.'); return }
    if (!dal || !userId) { setKayit('Dal / oturum çözülemedi.'); return }
    if (!not.trim()) { setKayit('Seans notu boş olamaz.'); return }
    if (!riza) { setKayit('Hasta Hakları m.26: iki nüsha rıza işaretlenmeden kayıt yok.'); return }
    if (kucuk && !veli) { setKayit('18 yaş altı: veli / yasal temsilci onamı zorunlu.'); return }
    if (muttefik && !plan) { setKayit('29.03.2025 md.16: hekim tanısı + plan olmadan uygulama yok.'); return }
    const defter = seansEkle(klinikDefterOku(userId), {
      patientId,
      dal,
      seans: {
        iso: new Date().toISOString().slice(0, 10),
        metin: not.trim(),
        rizaIkiNusha: riza,
        veliOnam: kucuk ? veli : null,
        fotoKvkk: foto,
        hekimPlani: plan,
        kriz112: kriz,
      },
    })
    klinikDefterYaz(userId, defter)
    setOnceki(defter[patientId]?.seanslar || [])
    setNot('')
    setKayit('Seans elektronik dosyaya yazıldı (cihaz kaydı). 29.03.2025 md.18 / Ayakta Teşhis md.24 belgelendi — canlı SBİYS / e-imza iddia edilmez.')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FFFAFA', fontFamily: 'system-ui' }}>
      <KlinikNav clinicName="Notya Klinik" />
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px 72px' }}>
        <Link href={patientId ? `/dashboard/klinik/hastalar/${patientId}` : '/dashboard/klinik/hastalar'} style={{ fontSize: 13, color: '#2563EB' }}>← Dosya</Link>
        <h1 style={{ margin: '12px 0 8px', fontSize: 26, color: '#0A1628' }}>Klinik seans</h1>
        <p style={{ fontSize: 13, color: 'rgba(10,22,40,0.55)' }}>{muttefik ? MUTTEFIK_TANI_KILIT : KLINIK_HEKIM_KILIT}</p>
        <ul style={{ fontSize: 12, color: 'rgba(10,22,40,0.55)', paddingLeft: 18 }}>
          {KLINIK_ORTAK_KAYIT.slice(0, 4).map((k) => <li key={k}>{k}</li>)}
        </ul>
        <textarea value={not} onChange={(e) => setNot(e.target.value)} rows={8} placeholder="Yapılan uygulama, vade, 112 bayrağı. Tanı ve doz yok." style={{ width: '100%', marginTop: 16, padding: 12, borderRadius: 10, border: '1px solid rgba(10,22,40,0.12)', fontSize: 14 }} />
        <label style={chk}><input type="checkbox" checked={riza} onChange={(e) => setRiza(e.target.checked)} /> İki nüsha rıza (dosya + hasta)</label>
        {kucuk && <label style={chk}><input type="checkbox" checked={veli} onChange={(e) => setVeli(e.target.checked)} /> Veli / yasal temsilci onamı (18 yaş altı)</label>}
        {!muttefik && <label style={chk}><input type="checkbox" checked={foto} onChange={(e) => setFoto(e.target.checked)} /> Klinik foto için ayrı KVKK rızası</label>}
        {muttefik && <label style={chk}><input type="checkbox" checked={plan} onChange={(e) => setPlan(e.target.checked)} /> Hekim tanısı + tedavi planı mevcut</label>}
        <label style={chk}><input type="checkbox" checked={kriz} onChange={(e) => setKriz(e.target.checked)} /> 112 / acil bayrağı</label>
        <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
          <button type="button" onClick={kaydet} style={{ padding: '10px 16px', borderRadius: 8, border: 'none', background: '#2563EB', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Dosyaya kaydet</button>
          <button type="button" onClick={() => router.push('/klinik-tools')} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #2563EB', background: '#fff', color: '#2563EB', fontWeight: 600, cursor: 'pointer' }}>Araçlar</button>
        </div>
        {kayit && <p style={{ marginTop: 12, fontSize: 13, color: '#065F46' }}>{kayit}</p>}
        {onceki.length > 0 && (
          <>
            <h2 style={{ margin: '28px 0 10px', fontSize: 16 }}>Kayıtlı seanslar</h2>
            {onceki.map((s) => (
              <div key={s.id} style={{ padding: '10px 12px', border: '1px solid rgba(10,22,40,0.08)', borderRadius: 8, marginBottom: 8, fontSize: 13 }}>
                <b>{s.iso}</b> · {s.metin}
                <div style={{ color: 'rgba(10,22,40,0.5)', fontSize: 12, marginTop: 4 }}>
                  {s.rizaIkiNusha ? 'rıza ✓' : 'rıza eksik'} · {s.kriz112 ? '112' : '112 yok'}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}

const chk: React.CSSProperties = { display: 'block', marginTop: 8, fontSize: 13, color: '#0A1628' }

export default function Page() {
  return <Suspense fallback={<p style={{ padding: 40 }}>Yükleniyor…</p>}><SeansIc /></Suspense>
}
