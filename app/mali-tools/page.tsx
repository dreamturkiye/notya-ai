'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

const TOOLS = [
  { letter: 'TL', title: 'Bordro Hesaplayıcı', desc: '2026 parametreleriyle anında net maşaş, SGK, kıdem ve işveren maliyeti hesabı', color: '#1B4332', bg: '#d8f3dc', route: '/mali-tools/bordro' },
  { letter: 'KD', title: 'Beyan Takvimi', desc: 'Tüm müşterileriniz için yaklaşan KDV, Muhtasar ve kurumlar vergisi tarihleri', color: '#1e3a5f', bg: '#dbeafe', route: '/mali-tools/takvim' },
  { letter: 'MA', title: 'MASAK Analiz', desc: '30.000 TL nakit sınırı ve şüpheli işlem uyumluluk kontrolü, anlık risk analizi', color: '#7C2D12', bg: '#fee2e2', route: '/mali-tools/masak' },
  { letter: 'GİB', title: 'GİB e-Beyan', desc: 'KDV hesaplama, iade tespiti ve GİB e-beyan sistemi entegrasyon rehberi', color: '#065F46', bg: '#d1fae5', route: '/mali-tools/ebeyan' },
  { letter: 'eD', title: 'e-Devlet Rehberi', desc: 'Vergi borcu, SGK prim, KOSGEB belgesi ve ticaret sicil sorgulama adım adım', color: '#1e40af', bg: '#eff6ff', route: '/mali-tools/edevlet' },
  { letter: 'MP', title: 'Müşteri Portalı', desc: 'Müşterilerinize özel Derya Yılmaz - 7/24 soru cevap, sizi aramadan', color: '#4C1D95', bg: '#ede9fe', route: '/mali-tools/portal' },
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
      <div style={{ color: '#fff', fontSize: 16 }}>Yükleniyor...</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#F1F5F9', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <style dangerouslySetInnerHTML={{__html: `
        .tools-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .tool-card { background: #fff; border-radius: 14px; padding: 20px; cursor: pointer; border: 1px solid #E5E7EB; box-shadow: 0 1px 3px rgba(0,0,0,0.07); display: flex; flex-direction: column; transition: all 0.15s ease; }
        .tool-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.12); transform: translateY(-2px); }
        .tool-btn { padding: 8px 0; text-align: center; border-radius: 8px; color: #fff; font-size: 13px; font-weight: 600; margin-top: auto; }
        @media(max-width: 640px) { .tools-grid { grid-template-columns: 1fr 1fr !important; gap: 10px !important; } .tool-card { padding: 14px !important; } }
        @media(max-width: 380px) { .tools-grid { grid-template-columns: 1fr !important; } }
      `}} />

      <nav style={{ background: '#0A1628', padding: '0 16px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, background: '#1B4332', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>N</span>
          </div>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>Notya AI</span>
        </div>
        <button onClick={() => router.push('/dashboard/mali')}
          style={{ color: 'rgba(255,255,255,0.7)', background: 'none', border: '1px solid rgba(255,255,255,0.2)', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>
          ← Dashboard
        </button>
      </nav>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0A1628', margin: '0 0 4px' }}>Mali Araçlar</h1>
          <p style={{ color: '#6B7280', fontSize: 14, margin: 0 }}>Zaman kazandıran 6 güç — günlük 1 saat tasarruf</p>
        </div>

        <div className="tools-grid">
          {TOOLS.map((tool, i) => (
            <div key={i} className="tool-card" onClick={() => router.push(tool.route)}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: tool.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, flexShrink: 0 }}>
                <span style={{ color: tool.color, fontWeight: 800, fontSize: 11 }}>{tool.letter}</span>
              </div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#0A1628', marginBottom: 6 }}>{tool.title}</div>
              <p style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.5, margin: '0 0 14px', flex: 1 }}>{tool.desc}</p>
              <div className="tool-btn" style={{ background: tool.color }}>Aç</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 20, background: 'linear-gradient(135deg, #4C1D95, #7C3AED)', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.15)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, color: '#fff', fontWeight: 700 }}>MP</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 13, marginBottom: 3 }}>Yeni: Müşteri Portalı</div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, lineHeight: 1.5 }}>Müşterileriniz sizi aramadan Derya Yılmaz’a sorabilir. Günlük 1 saat tasarruf.</div>
          </div>
          <button onClick={() => router.push('/mali-tools/portal')}
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
            İncele
          </button>
        </div>
      </div>
    </div>
  )
}
