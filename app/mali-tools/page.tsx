'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface ToolCard {
  emoji: string
  title: string
  desc: string
  color: string
  route: string
}

const tools: ToolCard[] = [
  { emoji: 'TL', title: 'Bordro Hesaplayici', desc: '2026 parametreleriyle aninda net maas, SGK ve kidem hesabi', color: '#1B4332', route: '/mali-tools/bordro' },
  { emoji: 'D', title: 'Beyan Takvimi', desc: 'Tum musterileriniz icin yaklasan beyan tarihleri ve kritik uyarilar', color: '#1e3a5f', route: '/mali-tools/takvim' },
  { emoji: 'M', title: 'MASAK Analiz', desc: 'Supheli islem ve 30.000 TL nakit siniri uyumluluk kontrolu', color: '#7C2D12', route: '/mali-tools/masak' },
  { emoji: 'e', title: 'GIB e-Beyan', desc: 'KDV hesaplama ve GIB beyan sistemi entegrasyonu', color: '#065F46', route: '/mali-tools/ebeyan' },
  { emoji: 'P', title: 'e-Devlet Rehberi', desc: 'Vergi borcu, SGK, KOSGEB sorgulama adim adim rehber', color: '#1e40af', route: '/mali-tools/edevlet' },
  { emoji: 'MP', title: 'Musteri Portali', desc: 'Musterilerinize ozel Derya Yilmaz - 7/24 soru-cevap', color: '#4C1D95', route: '/mali-tools/portal' },
]

export default function MaliToolsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/giris/mali')
      } else {
        setLoading(false)
      }
    }
    checkAuth()
  }, [router])

  if (loading) {
    return <div className="min-h-screen bg-[#0A1628] flex items-center justify-center"><div className="text-white">Yukleniyor...</div></div>
  }

  return (
    <div className="min-h-screen bg-[#0A1628]">
      <nav className="border-b border-white/10 bg-[#0A1628]">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-white text-xl font-semibold">Notya AI</div>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 text-sm text-white/80 hover:text-white transition-colors"
          >
            Dashboard'a Don
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 pt-8 pb-6">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-white">Mali Araclar</h1>
          <p className="text-white/60 mt-1">Zaman kazandiran 6 guc</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {tools.map((tool, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 flex flex-col hover:shadow-xl transition-all duration-200 border border-gray-100"
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-semibold mb-4"
                style={{ backgroundColor: tool.color }}
              >
                {tool.emoji}
              </div>
              <h3 className="text-[16px] font-semibold text-gray-900 mb-2">{tool.title}</h3>
              <p className="text-[13px] text-gray-500 flex-1 leading-snug">{tool.desc}</p>
              <button
                onClick={() => router.push(tool.route)}
                className="mt-6 w-full bg-[#FF6B4B] hover:bg-[#ff5a36] text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
              >
                Ac
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-8">
        <div className="bg-gradient-to-r from-purple-600 to-violet-600 rounded-2xl p-5 text-white">
          <p className="text-sm font-medium">
            Yeni: Musteri Portali ile musterileriniz sizi aramadan Derya Yilmaz'a sorabilir. Gunluk 1 saat tasarruf.
          </p>
        </div>
      </div>
    </div>
  )
}