"use client"

export const dynamic = 'force-dynamic'

import DoktorNav from '@/components/doktor/DoktorNav'
import { createClient } from '@supabase/supabase-js'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface KpiData {
  bugunkuMuayene: number
  bekleyenOnay: number
  buAyToplam: number
  aktifHasta: number
}

interface NoteItem {
  id: string
  specialty: string
  date: string
  content_subjektif: string
  approved_at?: string
}

const specialtyColors: { [key: string]: string } = {
  pediatri: '#0F9B8E',
  kardiyoloji: '#3B82F6',
  noroloji: '#8B5CF6',
  dahiliye: '#059669',
  psikiyatri: '#7C3AED',
  dermatoloji: '#F59E0B',
  default: '#64748B'
}

export default function DoktorDashboard() {
  const router = useRouter()
  const [doktorAdi, setDoktorAdi] = useState(() => { try { const c = localStorage.getItem('notya_doktor_name'); return c || 'Doktor' } catch { return 'Doktor' } })
  const [kpi, setKpi] = useState<KpiData>({ bugunkuMuayene: 0, bekleyenOnay: 0, buAyToplam: 0, aktifHasta: 0 })
  const [recentNotes, setRecentNotes] = useState<NoteItem[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const initDashboard = async () => {
      // Read token from auth-token (JSON blob) or Supabase sb- key
      const getToken = (): string | null => {
        try {
          const raw = localStorage.getItem('auth-token')
          if (raw) {
            const p = JSON.parse(raw)
            if (p.access_token) return p.access_token
          }
        } catch {}
        // Fallback: Supabase sb- key
        const sbKey = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.includes('auth'))
        if (sbKey) {
          try {
            const p = JSON.parse(localStorage.getItem(sbKey) || '{}')
            return p.access_token || null
          } catch {}
        }
        return null
      }
      const token = getToken()
      if (!token) {
        router.push('/giris/doktor')
        return
      }

      // 1. /api/users/me
      try {
        const meRes = await fetch('/api/users/me', {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (meRes.status === 401) {
          router.push('/giris/doktor')
          return
        }
        if (meRes.ok) {
          const meData = await meRes.json()
          const name = meData.data?.full_name || meData.data?.email?.split('@')[0] || 'Doktor'
          setDoktorAdi(name); try { localStorage.setItem('notya_doktor_name', name) } catch {}
        }
      } catch {}

      // 2. /api/doktor/raporlar
      try {
        const raporRes = await fetch('/api/doktor/raporlar', {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (raporRes.ok) {
          const raporData = await raporRes.json()
          setKpi(raporData.data || { bugunkuMuayene: 0, bekleyenOnay: 0, buAyToplam: 0, aktifHasta: 0 })
        } else {
          setKpi({ bugunkuMuayene: 0, bekleyenOnay: 0, buAyToplam: 0, aktifHasta: 0 })
        }
      } catch {
        setKpi({ bugunkuMuayene: 0, bekleyenOnay: 0, buAyToplam: 0, aktifHasta: 0 })
      }

      // 3. Supabase notes
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        const { data: notesData } = await supabase
          .from('notes')
          .select('id, specialty, created_at, content_subjektif, approved_at')
          .order('created_at', { ascending: false })
          .limit(5)
        if (notesData) {
          const mapped = notesData.map((n: any) => ({
            id: n.id,
            specialty: n.specialty || 'default',
            date: new Date(n.created_at).toLocaleDateString('tr-TR'),
            content_subjektif: n.content_subjektif || '',
            approved_at: n.approved_at
          }))
          setRecentNotes(mapped)
        }
      } catch {
        setRecentNotes([])
      }

      setLoading(false)
    }
    initDashboard()
  }, [router])

  const today = new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const handleChipClick = (path: string) => router.push(path)

  const getSpecialtyColor = (spec: string) => specialtyColors[spec.toLowerCase()] || specialtyColors.default

  return (
    <div style={{ background: '#0A1628', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif', color: '#fff' }}>
      <style>{`
        @keyframes fadeIn { 0%{opacity:0;transform:translateY(8px)} 100%{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>

      <DoktorNav />

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '12px 20px',
        animation: mounted ? 'fadeIn 300ms ease-out' : 'none'
      }}>
        {/* SECTION 1 - WELCOME BAR */}
        <div style={{
          minHeight: '72px',
          background: 'linear-gradient(135deg, #0F1E35 0%, #0A1628 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between', alignItems: 'flex-start',
          padding: '12px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.06)'
        }}>
          <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
            <div style={{ fontSize: '11px', color: '#94A3B8', letterSpacing: '0.5px' }}>Hoşgeldiniz</div>
            <div style={{ fontSize: '20px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Dr. {doktorAdi}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ fontSize: '10px', color: '#64748B', whiteSpace: 'nowrap' }}>{today}</div>
            <div style={{ width: '8px', height: '8px', background: '#10B981', borderRadius: '50%', animation: 'pulse 1.5s infinite' }}></div>
            <div style={{ fontSize: '11px', color: '#14B8A6' }}>Sistem aktif</div>
          </div>
        </div>

        {/* SECTION 2 - KPI CARDS */}
        <div style={{ padding: '28px 0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          {[
            { label: 'BUGÜNKÜ MUAYENE', value: kpi.bugunkuMuayene, color: '#0F9B8E', sub: 'hasta bugün' },
            { label: 'BEKLEYEN ONAY', value: kpi.bekleyenOnay, color: '#F59E0B', sub: 'not onayı bekliyor' },
            { label: 'BU AY TOPLAM', value: kpi.buAyToplam, color: '#3B82F6', sub: 'muayene bu ay' },
            { label: 'AKTİF HASTA', value: kpi.aktifHasta, color: '#10B981', sub: 'kayıtlı aktif hasta' }
          ].map((card, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderLeft: `3px solid ${card.color}`,
              borderRadius: '16px',
              padding: '24px',
              transition: 'all 200ms'
            }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'translateY(-2px)' }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.transform = 'none' }}>
              <div style={{ fontSize: '10px', color: card.color, letterSpacing: '1px', textTransform: 'uppercase' }}>{card.label}</div>
              {loading ? (
                <div style={{ height: '48px', width: '60px', background: '#334155', borderRadius: '4px', margin: '12px 0', animation: 'pulse 1.5s infinite' }}></div>
              ) : (
                <div style={{ fontSize: '48px', fontWeight: 700, color: card.color, lineHeight: 1 }}>{card.value}</div>
              )}
              <div style={{ fontSize: '12px', color: '#64748B' }}>{card.sub}</div>
            </div>
          ))}
        </div>

        {/* SECTION 3 - QUICK ACTIONS */}
        <div style={{ padding: '28px 0' }}>
          <div style={{ fontSize: '10px', color: '#64748B', marginBottom: '12px', letterSpacing: '1px' }}>HIZLI ERİŞİM</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', overflowX: 'auto' }}>
            {[
              { emoji: '🎙', text: 'Asistanı Aç', path: '/asistan' },
              { emoji: '➕', text: 'Hasta Ekle', path: '/dashboard/doktor/hasta-ekle' },
              { emoji: '📁', text: 'Belge Yükle', path: '/dashboard/doktor/belgeler' },
              { emoji: '✅', text: 'İnceleme', path: '/dashboard/doktor/inceleme' },
              { emoji: '🔬', text: 'Araçlar', path: '/doktor-tools' },
              { emoji: '📊', text: 'Raporlar', path: '/dashboard/doktor/raporlar' }
            ].map((chip, i) => (
              <div key={i} onClick={() => handleChipClick(chip.path)} style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '24px',
                padding: '10px 20px',
                fontSize: '14px',
                color: '#fff',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 200ms'
              }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(15,155,142,0.15)'; e.currentTarget.style.borderColor = 'rgba(15,155,142,0.4)'; e.currentTarget.style.color = '#0F9B8E' }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff' }}>
                {chip.emoji} {chip.text}
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 4 - TWO COLUMN */}
        <div style={{ padding: '28px 0', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          {/* LEFT: SON NOTLAR */}
          <div style={{ flex: '1.6', minWidth: '320px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ fontSize: '10px', color: '#64748B', letterSpacing: '1px' }}>SON NOTLAR</div>
              <div onClick={() => router.push('/dashboard/doktor/inceleme')} style={{ fontSize: '12px', color: '#14B8A6', cursor: 'pointer' }}>Tümünü Gör →</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '20px' }}>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => <div key={i} style={{ height: '42px', background: '#334155', borderRadius: '8px', marginBottom: '8px', animation: 'pulse 1.5s infinite' }}></div>)
              ) : recentNotes.length > 0 ? (
                recentNotes.map((note, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: idx < recentNotes.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <div style={{ background: getSpecialtyColor(note.specialty), color: '#fff', fontSize: '11px', padding: '4px 10px', borderRadius: '9999px', marginRight: '12px' }}>{note.specialty}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12px', color: '#64748B' }}>{note.date}</div>
                      <div style={{ fontSize: '13px', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{note.content_subjektif.substring(0, 60)}</div>
                    </div>
                    <div style={{ fontSize: '14px' }}>{note.approved_at ? '✅' : '🕒'}</div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🩺</div>
                  <div style={{ fontSize: '14px', color: '#64748B', marginBottom: '16px' }}>Henüz not yok</div>
                  <div onClick={() => router.push('/asistan')} style={{ display: 'inline-block', background: '#0F9B8E', color: '#fff', padding: '10px 24px', borderRadius: '24px', cursor: 'pointer' }}>Asistanı Başlat</div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: BU HAFTA */}
          <div style={{ flex: 1, minWidth: '280px' }}>
            <div style={{ fontSize: '10px', color: '#64748B', marginBottom: '12px', letterSpacing: '1px' }}>BU HAFTA ÖZETİ</div>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '20px' }}>
              {[
                { dot: '#0F9B8E', label: 'Bu Hafta Seans', val: kpi.buAyToplam },
                { dot: '#10B981', label: 'Onaylanan Not', val: kpi.buAyToplam - kpi.bekleyenOnay },
                { dot: '#F59E0B', label: 'Bekleyen', val: kpi.bekleyenOnay }
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '10px 0', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                  <div style={{ width: '6px', height: '6px', background: row.dot, borderRadius: '50%', marginRight: '10px' }}></div>
                  <div style={{ flex: 1, fontSize: '14px' }}>{row.label}</div>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>{row.val}</div>
                </div>
              ))}
              <div style={{ marginTop: '16px', fontSize: '10px', color: '#64748B', letterSpacing: '1px' }}>HIZLI ARAÇLAR</div>
              <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div onClick={() => router.push('/doktor-tools/epikriz')} style={{ color: '#14B8A6', fontSize: '12px', cursor: 'pointer' }}>Epikriz Üret →</div>
                <div onClick={() => router.push('/doktor-tools/icd10')} style={{ color: '#14B8A6', fontSize: '12px', cursor: 'pointer' }}>ICD-10 Kodla →</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '24px', textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.2)' }}>
        Notya AI 2026 • KVKK uyumlu
      </div>
    </div>
  )
}
