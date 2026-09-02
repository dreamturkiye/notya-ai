"use client"

export const dynamic = 'force-dynamic'

import DoktorNav from '@/components/doktor/DoktorNav'
import { createClient } from '@supabase/supabase-js'
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ensureDoctorAccessToken, DOKTOR_GIRIS } from '@/lib/doktor/clientAuth'

interface KpiData {
  bugunkuMuayene: number
  bekleyenOnay: number
  buAyToplam: number
  aktifHasta: number
}

interface RandevuOzet {
  id: string
  baslangic: string
  hastaAdi: string
  tur: string
  durum: string
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

const DURUM_RENK: { [key: string]: { label: string; color: string; bg: string } } = {
  planlandi: { label: 'Planlandı', color: '#0F9B8E', bg: 'rgba(15,155,142,0.15)' },
  onaylandi: { label: 'Onaylandı', color: '#22C55E', bg: 'rgba(34,197,94,0.15)' },
  tamamlandi: { label: 'Tamamlandı', color: '#64748B', bg: 'rgba(100,116,139,0.15)' },
  iptal: { label: 'İptal', color: '#EF4444', bg: 'rgba(239,68,68,0.15)' },
  gelmedi: { label: 'Gelmedi', color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
}

/** Yerel tarih anahtarı (yyyy-mm-dd) — toISOString() UTC'ye kayar, gece yarısına yakın
 * randevuları yanlış güne yerleştirebilir. randevular/page.tsx'deki aynı fonksiyonun kopyası. */
function yerelGunAnahtari(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const g = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${g}`
}

/** Pazartesi başlangıçlı bu haftanın Pzt–Paz tarihleri — takvim sayfasındaki ay ızgarasıyla
 * aynı hafta başlangıcı konvansiyonu. */
function buHaftaninGunleri(): Date[] {
  const bugun = new Date()
  const haftaIcindekiIndex = (bugun.getDay() + 6) % 7 // Pazartesi=0
  const pazartesi = new Date(bugun.getFullYear(), bugun.getMonth(), bugun.getDate() - haftaIcindekiIndex)
  return Array.from({ length: 7 }, (_, i) => new Date(pazartesi.getFullYear(), pazartesi.getMonth(), pazartesi.getDate() + i))
}

export default function DoktorDashboard() {
  const router = useRouter()
  const [doktorAdi, setDoktorAdi] = useState(() => { try { const c = localStorage.getItem('notya_doktor_name'); return c || 'Doktor' } catch { return 'Doktor' } })
  const [kpi, setKpi] = useState<KpiData>({ bugunkuMuayene: 0, bekleyenOnay: 0, buAyToplam: 0, aktifHasta: 0 })
  const [recentNotes, setRecentNotes] = useState<NoteItem[]>([])
  const [haftalikRandevular, setHaftalikRandevular] = useState<RandevuOzet[]>([])
  const [randevuGorunumu, setRandevuGorunumu] = useState<'bugun' | 'hafta'>('bugun')
  const [randevuYukleniyor, setRandevuYukleniyor] = useState(true)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const initDashboard = async () => {
      // NOTYA-AUTH-01: one convention. ensureDoctorAccessToken knows every storage shape Supabase
      // has used AND refreshes an expired token. The previous inline read did neither, so a doctor
      // reopening the app after an hour was sent to the login screen on a perfectly valid session.
      const token = await ensureDoctorAccessToken()
      if (!token) {
        router.push(DOKTOR_GIRIS)
        return
      }

      // 1. /api/users/me
      try {
        const meRes = await fetch('/api/users/me', {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (meRes.status === 401) {
          router.push(DOKTOR_GIRIS)
          return
        }
        if (meRes.ok) {
          const meData = await meRes.json()
          const ham = meData.data?.full_name || meData.data?.email?.split('@')[0] || 'Doktor'
          // The greeting prepends "Dr."; names saved with their own title rendered "Dr. Dr. Gökhan".
          // Strip leading academic/medical titles so the prefix is added exactly once.
          const name = ham.replace(/^\s*(?:(?:Prof|Doç|Uzm|Op|Dr|Dt)\.?\s+)+/i, '').trim() || ham
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
          const src = raporData?.data && typeof raporData.data === 'object' ? raporData.data : raporData
          setKpi({
            bugunkuMuayene: Number(src.bugunkuMuayene ?? src.buAyMuayene ?? 0) || 0,
            bekleyenOnay: Number(src.bekleyenOnay ?? src.bekleyen ?? 0) || 0,
            buAyToplam: Number(src.buAyToplam ?? src.buAyMuayene ?? src.toplamMuayene ?? 0) || 0,
            aktifHasta: Number(src.aktifHasta ?? 0) || 0,
          })
        } else {
          setKpi({ bugunkuMuayene: 0, bekleyenOnay: 0, buAyToplam: 0, aktifHasta: 0 })
        }
      } catch {
        setKpi({ bugunkuMuayene: 0, bekleyenOnay: 0, buAyToplam: 0, aktifHasta: 0 })
      }

      // 2.5 NOTYA-RANDEVU-03: bugün + bu hafta randevuları TEK istekte — haftanın tamamını
      // çekip bugünün altkümesini istemci tarafında filtreliyoruz, iki ayrı istek yerine.
      // Dashboard'un en üstünde, doktorun günün ilk baktığı ekranda görmesi gereken tek şey
      // "kim var, ne zaman". KPI kartları geçmişe bakar (bu ay toplam vb.); bu widget yalnızca
      // öne bakar.
      try {
        const haftaGunleri = buHaftaninGunleri()
        const baslangic = new Date(haftaGunleri[0]); baslangic.setHours(0, 0, 0, 0)
        const bitis = new Date(haftaGunleri[6]); bitis.setHours(23, 59, 59, 999)
        const rRes = await fetch(`/api/doktor/randevular?baslangic=${encodeURIComponent(baslangic.toISOString())}&bitis=${encodeURIComponent(bitis.toISOString())}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (rRes.ok) {
          const rData = await rRes.json()
          const siralı = (rData.randevular || [])
            .filter((r: any) => r.durum !== 'iptal')
            .sort((a: any, b: any) => new Date(a.baslangic).getTime() - new Date(b.baslangic).getTime())
          setHaftalikRandevular(siralı)
        }
      } catch {
        setHaftalikRandevular([])
      } finally {
        setRandevuYukleniyor(false)
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

  // NOTYA-RANDEVU-03: bugünün altkümesi, haftalık listeden türetiliyor — ayrı bir istek yok.
  const bugunkuRandevular = useMemo(
    () => haftalikRandevular.filter((rv) => yerelGunAnahtari(new Date(rv.baslangic)) === yerelGunAnahtari(new Date())),
    [haftalikRandevular]
  )

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
        overflowX: 'hidden',
        animation: mounted ? 'fadeIn 300ms ease-out' : 'none'
      }}>
        {/* SECTION 1 - WELCOME BAR */}
        <div style={{
          minHeight: '72px',
          background: 'linear-gradient(135deg, #0F1E35 0%, #0A1628 100%)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          padding: '18px 20px',
          marginTop: '12px',
          borderRadius: '14px',
          border: '1px solid rgba(255,255,255,0.06)',
          overflow: 'visible'
        }}>
          <div style={{ minWidth: 0, overflow: 'visible' }}>
            <div style={{ fontSize: '11px', color: '#94A3B8', letterSpacing: '0.5px', marginBottom: '6px' }}>Hoşgeldiniz</div>
            <div style={{ fontSize: '20px', fontWeight: 700, lineHeight: 1.45, paddingTop: '4px', overflow: 'visible' }}>Dr. {doktorAdi}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
            <div style={{ fontSize: '10px', color: '#64748B', whiteSpace: 'nowrap' }}>{today}</div>
            <div style={{ width: '8px', height: '8px', background: '#10B981', borderRadius: '50%', animation: 'pulse 1.5s infinite' }}></div>
            <div style={{ fontSize: '11px', color: '#14B8A6' }}>Sistem aktif</div>
          </div>
        </div>

        {/* SECTION 1.5 - RANDEVULAR: NOTYA-RANDEVU-03, karşılama şeridinden hemen sonra — KPI
            kartlarından önce, çünkü "kim var, ne zaman" bir doktorun aylık özet sayılarından daha
            acil bir sorudur. Bugün/Bu Hafta geçişi, takvim sayfasındaki Ay/Gün geçişiyle aynı
            konvansiyon. */}
        <div style={{ marginTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', borderRadius: '10px', padding: '3px' }}>
              <button
                type="button"
                onClick={() => setRandevuGorunumu('bugun')}
                style={{ background: randevuGorunumu === 'bugun' ? '#0F9B8E' : 'transparent', border: 'none', color: '#fff', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', cursor: 'pointer', letterSpacing: '0.5px' }}
              >BUGÜN</button>
              <button
                type="button"
                onClick={() => setRandevuGorunumu('hafta')}
                style={{ background: randevuGorunumu === 'hafta' ? '#0F9B8E' : 'transparent', border: 'none', color: '#fff', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', cursor: 'pointer', letterSpacing: '0.5px' }}
              >BU HAFTA</button>
            </div>
            <div onClick={() => router.push('/dashboard/doktor/randevular')} style={{ fontSize: '12px', color: '#14B8A6', cursor: 'pointer', whiteSpace: 'nowrap' }}>Takvimi Aç &rarr;</div>
          </div>

          {randevuGorunumu === 'bugun' ? (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: bugunkuRandevular.length > 0 || randevuYukleniyor ? '8px 20px' : '20px' }}>
              {randevuYukleniyor ? (
                <div style={{ padding: '12px 0' }}>
                  {Array.from({ length: 2 }).map((_, i) => <div key={i} style={{ height: '38px', background: '#334155', borderRadius: '8px', marginBottom: '8px', animation: 'pulse 1.5s infinite' }}></div>)}
                </div>
              ) : bugunkuRandevular.length > 0 ? (
                <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', padding: '12px 0' }}>
                  {bugunkuRandevular.map((rv) => {
                    const durumBilgi = DURUM_RENK[rv.durum] || DURUM_RENK.planlandi
                    const saat = new Date(rv.baslangic).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
                    return (
                      <div
                        key={rv.id}
                        onClick={() => router.push('/dashboard/doktor/randevular')}
                        style={{
                          flex: '0 0 auto',
                          minWidth: '150px',
                          background: 'rgba(255,255,255,0.04)',
                          border: `1px solid ${durumBilgi.color}33`,
                          borderRadius: '12px',
                          padding: '10px 14px',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ fontSize: '15px', fontWeight: 700, color: durumBilgi.color }}>{saat}</div>
                        <div style={{ fontSize: '13px', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>{rv.hastaAdi}</div>
                        <div style={{ fontSize: '10px', color: durumBilgi.color, marginTop: '2px' }}>{durumBilgi.label}</div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ fontSize: '14px', color: '#64748B' }}>Bugün için randevu yok</div>
                  <div onClick={() => router.push('/dashboard/doktor/randevular')} style={{ background: '#0F9B8E', color: '#fff', padding: '8px 18px', borderRadius: '24px', cursor: 'pointer', fontSize: '13px', whiteSpace: 'nowrap' }}>+ Randevu Ekle</div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '8px 20px' }}>
              {randevuYukleniyor ? (
                <div style={{ padding: '12px 0' }}>
                  {Array.from({ length: 3 }).map((_, i) => <div key={i} style={{ height: '38px', background: '#334155', borderRadius: '8px', marginBottom: '8px', animation: 'pulse 1.5s infinite' }}></div>)}
                </div>
              ) : haftalikRandevular.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', padding: '20px 0' }}>
                  <div style={{ fontSize: '14px', color: '#64748B' }}>Bu hafta için randevu yok</div>
                  <div onClick={() => router.push('/dashboard/doktor/randevular')} style={{ background: '#0F9B8E', color: '#fff', padding: '8px 18px', borderRadius: '24px', cursor: 'pointer', fontSize: '13px', whiteSpace: 'nowrap' }}>+ Randevu Ekle</div>
                </div>
              ) : (
                <div style={{ padding: '10px 0' }}>
                  {buHaftaninGunleri().map((gunTarihi) => {
                    const anahtar = yerelGunAnahtari(gunTarihi)
                    const guninRandevulari = haftalikRandevular.filter((rv) => trtGunAnahtari(rv.baslangic) === anahtar)
                    if (guninRandevulari.length === 0) return null
                    const bugunMu = anahtar === trtGunAnahtari(new Date())
                    const gunEtiketi = gunTarihi.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })
                    return (
                      <div key={anahtar} style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '11px', color: bugunMu ? '#0F9B8E' : '#64748B', fontWeight: 600, marginBottom: '8px', textTransform: 'capitalize' }}>
                          {bugunMu ? `Bugün · ${gunEtiketi}` : gunEtiketi}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {guninRandevulari.map((rv) => {
                            const durumBilgi = DURUM_RENK[rv.durum] || DURUM_RENK.planlandi
                            const saat = new Date(rv.baslangic).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
                            return (
                              <div
                                key={rv.id}
                                onClick={() => router.push('/dashboard/doktor/randevular')}
                                style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '4px 0' }}
                              >
                                <div style={{ fontSize: '13px', fontWeight: 700, color: durumBilgi.color, minWidth: '46px' }}>{saat}</div>
                                <div style={{ fontSize: '13px', color: '#fff', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rv.hastaAdi}</div>
                                <div style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '999px', color: durumBilgi.color, background: durumBilgi.bg, whiteSpace: 'nowrap' }}>{durumBilgi.label}</div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            {[
              { emoji: '📅', text: 'Randevular', path: '/dashboard/doktor/randevular' },
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
                textAlign: 'center',
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
          <div style={{ flex: '1.6', minWidth: '320px', marginRight: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ fontSize: '10px', color: '#64748B', letterSpacing: '1px' }}>SON NOTLAR</div>
              <div onClick={() => router.push('/dashboard/doktor/inceleme')} style={{ fontSize: '12px', color: '#14B8A6', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap', paddingRight: '2px' }}>Tümünü Gör &rarr;</div>
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
