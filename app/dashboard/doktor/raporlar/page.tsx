'use client'

export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from 'react'
import DoktorNav from '@/components/doktor/DoktorNav'

interface Tanilar {
  icd10: string
  aciklama: string
  count: number
}

interface Uzmanlik {
  uzmanlik: string
  count: number
}

interface Stats {
  bugunMuayene: number
  buAyMuayene: number
  toplamHasta: number
  bekleyenOnay: number
  topTanilar: Tanilar[]
  topUzmanliklar: Uzmanlik[]
}

interface ActivityDay {
  date: string
  count: number
}

interface RaporData {
  stats: Stats
  doktorAdi: string
  activity: ActivityDay[]
}

export default function DoktorRaporlarPage() {
  const [stats, setStats] = useState<Stats>({
    bugunMuayene: 0,
    buAyMuayene: 0,
    toplamHasta: 0,
    bekleyenOnay: 0,
    topTanilar: [],
    topUzmanliklar: [],
  })
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [doktorAdi, setDoktorAdi] = useState('')
  const [activity, setActivity] = useState<ActivityDay[]>([])

  const fetchRaporlar = async (month: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/doktor/raporlar?month=${month}`, {
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Veri alınamadı')
      const data: RaporData = await res.json()
      setStats(data.stats)
      setDoktorAdi(data.doktorAdi)
      setActivity(data.activity || [])
    } catch (error) {
      console.error(error)
      setStats({
        bugunMuayene: 0,
        buAyMuayene: 0,
        toplamHasta: 0,
        bekleyenOnay: 0,
        topTanilar: [],
        topUzmanliklar: [],
      })
      setActivity([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRaporlar(selectedMonth)
  }, [selectedMonth])

  const changeMonth = (delta: number) => {
    const [year, month] = selectedMonth.split('-').map(Number)
    const date = new Date(year, month - 1 + delta, 1)
    const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    setSelectedMonth(newMonth)
  }

  const maxUzmanlik = Math.max(...stats.topUzmanliklar.map(u => u.count), 1)
  const maxTanilar = Math.max(...stats.topTanilar.map(t => t.count), 1)

  const getHeatmapColor = (count: number) => {
    if (count === 0) return 'bg-zinc-800'
    if (count <= 2) return 'bg-teal-700'
    return 'bg-teal-500'
  }

  const renderHeatmap = () => {
    const days = Array.from({ length: 35 }, (_, i) => {
      const dayIndex = i
      const dayData = activity[dayIndex] || { date: '', count: 0 }
      return dayData
    })

    return (
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => (
          <div
            key={index}
            className={`aspect-square rounded ${getHeatmapColor(day.count)} flex items-center justify-center text-[10px] text-white/70`}
            title={`${day.date || ''} - ${day.count} seans`}
          >
            {day.count > 0 ? day.count : ''}
          </div>
        ))}
      </div>
    )
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white">
        <DoktorNav />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-zinc-400">Raporlar yükleniyor...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <DoktorNav />
      
      <div className="max-w-7xl mx-auto px-6 py-8 print:px-0 print:py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 print:mb-4">
          <div>
            <h1 className="text-3xl font-semibold">Aylık Klinik Rapor</h1>
            <p className="text-zinc-400 mt-1">{doktorAdi}</p>
          </div>
          
          <div className="flex items-center gap-4 print:hidden">
            <div className="flex items-center bg-zinc-900 rounded-lg border border-zinc-800">
              <button
                onClick={() => changeMonth(-1)}
                className="px-3 py-2 hover:bg-zinc-800 rounded-l-lg"
              >
                ←
              </button>
              <div className="px-4 py-2 font-mono text-sm border-x border-zinc-800">
                {selectedMonth}
              </div>
              <button
                onClick={() => changeMonth(1)}
                className="px-3 py-2 hover:bg-zinc-800 rounded-r-lg"
              >
                →
              </button>
            </div>
            
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-white text-zinc-950 rounded-lg font-medium hover:bg-zinc-200 flex items-center gap-2"
            >
              PDF İndir
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <div className="text-sm text-zinc-400">Bu Ay Muayene</div>
            <div className="text-4xl font-semibold mt-2">{stats.buAyMuayene}</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <div className="text-sm text-zinc-400">Toplam Aktif Hasta</div>
            <div className="text-4xl font-semibold mt-2">{stats.toplamHasta}</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <div className="text-sm text-zinc-400">Bekleyen Onay</div>
            <div className="text-4xl font-semibold mt-2">{stats.bekleyenOnay}</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <div className="text-sm text-zinc-400">Tamamlanan Notlar</div>
            <div className="text-4xl font-semibold mt-2">{stats.bugunMuayene}</div>
          </div>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          {/* En Çok Konulan Tanılar */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="font-semibold mb-4">En Çok Konulan Tanılar</h3>
            {stats.topTanilar.length === 0 ? (
              <div className="text-zinc-500 py-8 text-center">Bu ay tanı verisi bulunamadı.</div>
            ) : (
              <div className="space-y-3">
                {stats.topTanilar.slice(0, 5).map((tani, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-16 font-mono text-xs text-teal-400">{tani.icd10}</div>
                    <div className="flex-1 text-sm">{tani.aciklama}</div>
                    <div className="flex items-center gap-2 w-32">
                      <div className="flex-1 bg-zinc-800 h-1.5 rounded">
                        <div 
                          className="bg-teal-500 h-1.5 rounded" 
                          style={{ width: `${(tani.count / maxTanilar) * 100}%` }}
                        />
                      </div>
                      <div className="text-xs w-6 text-right">{tani.count}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Uzmanlık Dağılımı */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="font-semibold mb-4">Uzmanlık Dağılımı</h3>
            {stats.topUzmanliklar.length === 0 ? (
              <div className="text-zinc-500 py-8 text-center">Bu ay uzmanlık verisi bulunamadı.</div>
            ) : (
              <div className="space-y-4">
                {stats.topUzmanliklar.map((uzm, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span>{uzm.uzmanlik}</span>
                      <span className="text-zinc-400">{uzm.count}</span>
                    </div>
                    <div className="bg-zinc-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-teal-500 h-2 rounded-full transition-all" 
                        style={{ width: `${(uzm.count / maxUzmanlik) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Row 3 - Heatmap */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h3 className="font-semibold mb-4">Son 30 Gün Aktivite</h3>
          {activity.length === 0 ? (
            <div className="text-zinc-500 py-8 text-center">Aktivite verisi bulunamadı.</div>
          ) : (
            renderHeatmap()
          )}
          <div className="flex gap-4 mt-4 text-xs text-zinc-500">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-zinc-800 rounded" /> 0</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-teal-700 rounded" /> 1-2</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-teal-500 rounded" /> 3+</div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          nav, button, .print\\:hidden {
            display: none !important;
          }
          body {
            background: white !important;
            color: black !important;
          }
          .bg-zinc-950, .bg-zinc-900 {
            background: white !important;
            border-color: #e5e7eb !important;
          }
          .text-white, .text-zinc-400 {
            color: black !important;
          }
        }
      `}</style>
    </div>
  )
}
