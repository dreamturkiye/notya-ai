
'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function PortalPage() {
  const router = useRouter()
  const [musteriler, setMusteriler] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/giris/mali'); return }
      const { data } = await supabase.from('mali_musteriler').select('*').eq('musavir_id', session.user.id).order('sirket_adi')
      setMusteriler(data || [])
      setLoading(false)
    })
  }, [])

  function generateLink(musteri: any) {
    const token = btoa(musteri.id + ':' + musteri.musavir_id + ':' + Date.now())
    return window.location.origin + '/portal/' + token
  }

  async function copyLink(musteri: any) {
    const link = generateLink(musteri)
    await navigator.clipboard.writeText(link)
    setCopiedId(musteri.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F1F5F9', fontFamily: 'system-ui,sans-serif' }}>
      <nav style={{ background: '#0A1628', padding: '0 20px', height: 56, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.push('/mali-tools')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 20 }}>{'<'}</button>
        <span style={{ color: '#fff', fontWeight: 700 }}>Musteri Portali</span>
      </nav>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: 20 }}>
        <div style={{ background: 'linear-gradient(135deg, #4C1D95, #7C3AED)', borderRadius: 12, padding: 20, marginBottom: 20, color: '#fff' }}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Derya Yilmaz - Musteri Portali</div>
          <div style={{ fontSize: 13, opacity: 0.85, lineHeight: 1.6 }}>
            Her musteriniz icin ozel bir link olusturun. Musteriniz bu link uzerinden Derya Yilmaz ile 7/24 soru sorabilir. Sizi aramadan, sizi rahatsiz etmeden.
          </div>
        </div>
        {loading ? <div style={{ textAlign: 'center', padding: 40, color: '#6B7280' }}>Yukleniyor...</div> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {musteriler.length === 0 && (
              <div style={{ background: '#fff', borderRadius: 12, padding: 32, textAlign: 'center', color: '#6B7280' }}>
                Henuz musteri eklemediniz. Dashboard'dan musteri ekleyin.
              </div>
            )}
            {musteriler.map((m: any) => (
              <div key={m.id} style={{ background: '#fff', borderRadius: 10, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#0A1628' }}>{m.sirket_adi}</div>
                  {m.vergi_no && <div style={{ fontSize: 12, color: '#6B7280' }}>VN: {m.vergi_no}</div>}
                </div>
                <button onClick={() => copyLink(m)}
                  style={{ padding: '8px 16px', background: copiedId === m.id ? '#1B4332' : '#4C1D95', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  {copiedId === m.id ? 'Kopyalandi!' : 'Link Kopyala'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
