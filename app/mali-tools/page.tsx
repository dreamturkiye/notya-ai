
'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

const TOOLS = [
  { letter: 'TL', title: 'Bordro Hesaplayici', desc: '2026 parametreleriyle aninda net maas, SGK, kidem ve isveren maliyeti hesabi', color: '#1B4332', bg: '#d8f3dc', route: '/mali-tools/bordro' },
  { letter: 'KD', title: 'Beyan Takvimi', desc: 'Tum musterileriniz icin yaklasan KDV, Muhtasar ve kurumlar vergisi tarihleri', color: '#1e3a5f', bg: '#dbeafe', route: '/mali-tools/takvim' },
  { letter: 'MA', title: 'MASAK Analiz', desc: '30.000 TL nakit siniri ve supheli islem uyumluluk kontrolu, anlik risk analizi', color: '#7C2D12', bg: '#fee2e2', route: '/mali-tools/masak' },
  { letter: 'GIB', title: 'GIB e-Beyan', desc: 'KDV hesaplama, iade tespiti ve GIB e-beyan sistemi entegrasyon rehberi', color: '#065F46', bg: '#d1fae5', route: '/mali-tools/ebeyan' },
  { letter: 'eD', title: 'e-Devlet Rehberi', desc: 'Vergi borcu, SGK prim, KOSGEB belgesi ve ticaret sicil sorgulama adim adim', color: '#1e40af', bg: '#eff6ff', route: '/mali-tools/edevlet' },
  { letter: 'MP', title: 'Musteri Portali', desc: 'Musterilerinize ozel Derya Yilmaz - 7/24 soru cevap, sizi aramadan', color: '#4C1D95', bg: '#ede9fe', route: '/mali-tools/portal' },
]

export default function MaliToolsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [hover, setHover] = useState<number | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/giris/mali')
      else setLoading(false)
    })
  }, [])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0A1628', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#fff', fontSize: 16 }}>Yukleniyor...</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#F1F5F9', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* NAV */}
      <nav style={{ background: '#0A1628', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, background: '#1B4332', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>N</span>
          </div>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 17 }}>Notya AI</span>
        </div>
        <button onClick={() => router.push('/dashboard/mali')}
          style={{ color: 'rgba(255,255,255,0.7)', background: 'none', border: '1px solid rgba(255,255,255,0.2)', padding: '6px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
          Dashboard'a Don
        </button>
      </nav>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px' }}>

        {/* HEADER */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#0A1628', margin: '0 0 6px' }}>Mali Araclar</h1>
          <p style={{ color: '#6B7280', fontSize: 15, margin: 0 }}>Zaman kazandiran 6 guc — gunluk 1 saat tasarruf</p>
        </div>

        {/* GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          <style dangerouslySetInnerHTML={{__html: '@media(max-width:700px){.tools-grid{grid-template-columns:1fr 1fr!important;}.tools-grid .tool-card{padding:16px!important;}}@media(max-width:420px){.tools-grid{grid-template-columns:1fr!important;}}' }} />
          {TOOLS.map((tool, i) => (
            <div key={i}
              className="tool-card"
              onClick={() => router.push(tool.route)}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              style={{
                background: '#fff',
                borderRadius: 14,
                padding: 22,
                cursor: 'pointer',
                border: '1px solid #E5E7EB',
                boxShadow: hover === i ? '0 8px 24px rgba(0,0,0,0.12)' : '0 1px 3px rgba(0,0,0,0.07)',
                transform: hover === i ? 'translateY(-2px)' : 'none',
                transition: 'all 0.15s ease',
                display: 'flex',
                flexDirection: 'column',
              }}>
              {/* Icon */}
              <div style={{ width: 48, height: 48, borderRadius: 12, background: tool.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <span style={{ color: tool.color, fontWeight: 800, fontSize: 13 }}>{tool.letter}</span>
              </div>
              {/* Title */}
              <div style={{ fontWeight: 700, fontSize: 15, color: '#0A1628', marginBottom: 8 }}>{tool.title}</div>
              {/* Desc */}
              <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6, margin: '0 0 16px', flex: 1 }}>{tool.desc}</p>
              {/* Button */}
              <div style={{ padding: '8px 0', textAlign: 'center', background: tool.color, borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 600 }}>Ac</div>
            </div>
          ))}
        </div>

        {/* BANNER */}
        <div style={{ marginTop: 24, background: 'linear-gradient(135deg, #4C1D95, #7C3AED)', borderRadius: 12, padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.15)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 20 }}>MP</span>
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Yeni: Musteri Portali</div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, lineHeight: 1.5 }}>Musterileriniz sizi aramadan Derya Yilmaz'a sorabilir. Gunluk 1 saat tasarruf.</div>
          </div>
          <button onClick={() => router.push('/mali-tools/portal')}
            style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
            Incele
          </button>
        </div>
      </div>
    </div>
  )
}
